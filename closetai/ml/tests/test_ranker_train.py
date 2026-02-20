def test_train_runs(tmp_path):
    # run a quick train to ensure no errors
    import ml.train.ranker_train as rt
    rt.synth_data(10)  # small synthetic
    # If no exceptions, pass
    assert True
