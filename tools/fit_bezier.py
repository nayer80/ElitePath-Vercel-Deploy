#!/usr/bin/env python3
"""
Fit a CSS cubic-bezier(x1,y1,x2,y2) and duration to a menu progress CSV.
Usage:
  python tools/fit_bezier.py tools/menu_progress.csv

Output: prints best-fit control points and duration (s).

Dependencies: numpy, scipy
Install: pip install numpy scipy
"""
import csv
import sys
import math
import numpy as np
from scipy.optimize import minimize


def read_progress(csv_path):
    times = []
    prog = []
    with open(csv_path, newline='') as f:
        r = csv.DictReader(f)
        for row in r:
            times.append(float(row['time_s']))
            prog.append(float(row['progress']))
    return np.array(times), np.array(prog)


def find_transition(times, prog, low_thresh=0.02, high_thresh=0.98):
    # find first time where progress > low_thresh
    inds = np.where(prog > low_thresh)[0]
    if inds.size == 0:
        return None
    start = inds[0]
    # find first time after start where progress >= high_thresh
    inds2 = np.where(prog[start:] >= high_thresh)[0]
    if inds2.size == 0:
        end = len(prog) - 1
    else:
        end = start + inds2[0]
    return start, end


def cubic_bezier_xy(t, x1, y1, x2, y2):
    # returns (x(t), y(t)) for param t in [0,1]
    u = 1.0 - t
    x = 3 * (u*u) * t * x1 + 3 * u * (t*t) * x2 + t**3
    y = 3 * (u*u) * t * y1 + 3 * u * (t*t) * y2 + t**3
    return x, y


def bezier_y_for_x(x_target, x1, y1, x2, y2, iters=30):
    # invert x(t) == x_target by Newton or binary search; use binary search for robustness
    lo = 0.0
    hi = 1.0
    for _ in range(iters):
        mid = 0.5 * (lo + hi)
        xm, ym = cubic_bezier_xy(mid, x1, y1, x2, y2)
        if xm < x_target:
            lo = mid
        else:
            hi = mid
    _, y = cubic_bezier_xy(0.5 * (lo + hi), x1, y1, x2, y2)
    return y


def loss_for_params(params, us, measured):
    x1, y1, x2, y2 = params
    preds = np.array([bezier_y_for_x(u, x1, y1, x2, y2) for u in us])
    return float(np.mean((preds - measured) ** 2))


def fit_bezier(us, measured):
    # bounds 0..1 for all params
    bounds = [(0.0, 1.0)] * 4
    # start from 'ease' as initial guess
    init = np.array([0.25, 0.1, 0.25, 1.0])
    best = None
    best_val = float('inf')
    # try a few inits
    inits = [init, np.array([0.4,0.0,0.2,1.0]), np.array([0.0,0.0,0.58,1.0]), np.array([0.42,0,0.58,1])]
    for init_guess in inits:
        res = minimize(lambda p: loss_for_params(p, us, measured), init_guess, bounds=bounds, method='L-BFGS-B')
        if res.fun < best_val:
            best_val = res.fun
            best = res.x
    return best, best_val


def main():
    if len(sys.argv) < 2:
        print('Usage: python tools/fit_bezier.py path/to/menu_progress.csv')
        sys.exit(1)
    csv_path = sys.argv[1]
    times, prog = read_progress(csv_path)
    trans = find_transition(times, prog, low_thresh=0.02, high_thresh=0.98)
    if trans is None:
        print('No transition detected in progress data')
        sys.exit(2)
    sidx, eidx = trans
    start_t = times[sidx]
    end_t = times[eidx]
    duration = max(1e-6, end_t - start_t)
    # build normalized u values for frames between start..end (inclusive)
    sel_times = times[sidx:eidx+1]
    sel_prog = prog[sidx:eidx+1]
    us = (sel_times - start_t) / duration
    us = np.clip(us, 0.0, 1.0)

    # fit cubic-bezier
    best, err = fit_bezier(us, sel_prog)
    x1, y1, x2, y2 = best
    print('Fitted cubic-bezier: x1={:.4f}, y1={:.4f}, x2={:.4f}, y2={:.4f}'.format(x1, y1, x2, y2))
    print('Duration (s): {:.3f}'.format(duration))
    print('Mean squared error: {:.6f}'.format(err))


if __name__ == '__main__':
    main()
