#!/usr/bin/env python3
"""
Collaborative filtering prediction script (mock/demo).
In production, load a pre-trained ALS model and compute user-item scores.
For demo: returns uniform scores when model is not available.
"""
import sys
import json

def main():
    user_id = sys.argv[1] if len(sys.argv) > 1 else ""
    candidate_outfits = []
    if len(sys.argv) > 2:
        try:
            candidate_outfits = json.loads(sys.argv[2])
        except json.JSONDecodeError:
            pass

    # Mock: no pre-trained model. Return scores that favor variety.
    # In production: load model, user_to_idx, item_to_idx; compute dot products.
    n = len(candidate_outfits) if isinstance(candidate_outfits, list) else 0
    if n == 0:
        print(json.dumps([]))
        return

    # Simulate CF scores with slight variation for demo
    import random
    random.seed(hash(user_id) % (2**32) if user_id else 42)
    scores = [0.4 + random.random() * 0.5 for _ in range(n)]
    print(json.dumps(scores))

if __name__ == "__main__":
    main()
