"""
Train a tiny MLP ranker using synthetic demo data.
Produces ml/models/ranker_demo.pt
"""
import os
import json
import random
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sklearn.model_selection import train_test_split

MODEL_DIR = os.path.join(os.path.dirname(__file__), '..','models')
os.makedirs(MODEL_DIR, exist_ok=True)

# Synthetic dataset: user_emb (32), item_emb (32), label 0/1
def synth_data(n=1000):
    X=[]
    y=[]
    for _ in range(n):
        u = np.random.randn(32)
        i = u + 0.3*np.random.randn(32) if random.random() < 0.2 else np.random.randn(32)
        label = 1 if np.dot(u,i) > 5 else 0
        X.append(np.concatenate([u,i]))
        y.append(label)
    return np.array(X,dtype=np.float32), np.array(y,dtype=np.float32)

class RankerDataset(Dataset):
    def __init__(self, X,y):
        self.X=X; self.y=y
    def __len__(self): return len(self.X)
    def __getitem__(self, idx): return self.X[idx], self.y[idx]

class MLP(nn.Module):
    def __init__(self, inp=64):
        super().__init__()
        self.net = nn.Sequential(nn.Linear(inp,128), nn.ReLU(), nn.Dropout(0.1), nn.Linear(128,64), nn.ReLU(), nn.Linear(64,1))
    def forward(self,x): return self.net(x).squeeze(-1)

def train():
    X,y = synth_data(2000)
    X_train, X_val, y_train, y_val = train_test_split(X,y,test_size=0.2)
    ds_train = RankerDataset(X_train,y_train)
    ds_val = RankerDataset(X_val,y_val)
    dl = DataLoader(ds_train, batch_size=64, shuffle=True)
    model = MLP()
    opt = torch.optim.Adam(model.parameters(), lr=1e-3)
    loss_fn = nn.BCEWithLogitsLoss()
    for epoch in range(10):
        model.train()
        total=0; los=0
        for xb,yb in dl:
            xb=torch.tensor(xb); yb=torch.tensor(yb)
            pred = model(xb)
            loss = loss_fn(pred, yb)
            opt.zero_grad(); loss.backward(); opt.step()
            total+=len(xb); los+=loss.item()*len(xb)
        print('epoch',epoch,'loss',los/total)
    torch.save(model.state_dict(), os.path.join(MODEL_DIR,'ranker_demo.pt'))
    print('Saved model to', os.path.join(MODEL_DIR,'ranker_demo.pt'))

if __name__=='__main__':
    train()
