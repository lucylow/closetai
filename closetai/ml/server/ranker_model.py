# very small inference wrapper that exposes /score
from flask import Flask, request, jsonify
import torch
import numpy as np
import os
from ml.train.ranker_train import MLP

app = Flask(__name__)
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..','models','ranker_demo.pt')
model = MLP()
if os.path.exists(MODEL_PATH):
    model.load_state_dict(torch.load(MODEL_PATH))
model.eval()

@app.route('/score', methods=['POST'])
def score():
    payload = request.json
    # candidates: list of feature vectors (list of floats)
    candidates = payload.get('candidates', [])
    # user features ignored for demo, we take candidates as full vector
    X = np.array(candidates, dtype=np.float32)
    with torch.no_grad():
        preds = model(torch.tensor(X)).numpy().tolist()
    return jsonify({"scores": preds})

if __name__=='__main__':
    app.run(host='0.0.0.0', port=8501)
