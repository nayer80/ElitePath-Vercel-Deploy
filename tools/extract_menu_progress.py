#!/usr/bin/env python3
"""
Simple analyzer to estimate the opening progress of a top navigation overlay from a mobile screen recording.
Usage:
  python tools/extract_menu_progress.py "path/to/video.mp4" --out progress.csv

Dependencies: opencv-python, numpy
Install: pip install opencv-python numpy

Output: CSV with columns: frame_index, time_s, progress (0-1)

Note: This script uses a heuristic: it computes per-frame absolute difference vs the first frame in the top region of the frame (top 40%) and uses the normalized summed difference as a proxy for how 'open' the menu is. It works best if the video only shows the menu opening animation from closed to open.
"""
import cv2
import numpy as np
import sys
import csv
import os
import argparse


def analyze(video_path, out_csv, top_fraction=0.4, blur=5):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print('Unable to open video:', video_path)
        return 1

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    print(f'Opened {video_path}: {frame_count} frames, {fps:.2f} fps')

    # read first frame
    ret, first = cap.read()
    if not ret:
        print('Failed to read first frame')
        return 1
    h, w = first.shape[:2]
    top_h = int(h * top_fraction)

    # convert first frame to gray and crop top
    first_gray = cv2.cvtColor(first, cv2.COLOR_BGR2GRAY)
    first_top = first_gray[:top_h, :]
    if blur > 0:
        first_top = cv2.GaussianBlur(first_top, (blur, blur), 0)

    diffs = []
    times = []
    idx = 0

    # process first frame
    diff0 = 0.0
    diffs.append(diff0)
    times.append(0.0)
    idx = 1

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        top = gray[:top_h, :]
        if blur > 0:
            top = cv2.GaussianBlur(top, (blur, blur), 0)
        # absolute diff
        d = cv2.absdiff(top, first_top)
        s = float(d.sum())
        diffs.append(s)
        times.append(idx / fps)
        idx += 1

    cap.release()

    diffs = np.array(diffs)
    # normalize to 0..1
    # sometimes there is camera noise — smooth with rolling median
    try:
        from scipy.signal import medfilt
        diffs_s = medfilt(diffs, kernel_size=5)
    except Exception:
        # fallback to simple gaussian smoothing via convolution
        kernel = np.exp(-0.5 * (np.linspace(-2,2,5)**2))
        kernel = kernel / kernel.sum()
        diffs_s = np.convolve(diffs, kernel, mode='same')

    # scale between min (close) and max (open)
    lo = diffs_s.min()
    hi = diffs_s.max()
    if hi - lo < 1e-6:
        progress = np.zeros_like(diffs_s)
    else:
        progress = (diffs_s - lo) / (hi - lo)
        progress = np.clip(progress, 0.0, 1.0)

    # Write CSV
    with open(out_csv, 'w', newline='') as f:
        wcsv = csv.writer(f)
        wcsv.writerow(['frame_index', 'time_s', 'raw_diff', 'smooth_diff', 'progress'])
        for i, (t, d, ds, p) in enumerate(zip(times, diffs, diffs_s, progress)):
            wcsv.writerow([i, f'{t:.6f}', f'{d:.3f}', f'{ds:.3f}', f'{p:.6f}'])

    print(f'Wrote progress CSV to {out_csv}')
    return 0


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Extract menu opening progress from a mobile recording')
    parser.add_argument('video', help='Path to video file')
    parser.add_argument('--out', dest='out', default='menu_progress.csv', help='Output CSV path')
    parser.add_argument('--top-fraction', dest='top_fraction', type=float, default=0.4, help='Fraction of top area to analyze')
    parser.add_argument('--blur', dest='blur', type=int, default=5, help='Gaussian blur kernel size (odd)')
    args = parser.parse_args()

    if not os.path.exists(args.video):
        print('Video file not found:', args.video)
        sys.exit(2)
    rc = analyze(args.video, args.out, top_fraction=args.top_fraction, blur=args.blur)
    sys.exit(rc)
