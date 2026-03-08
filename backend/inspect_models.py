"""Quick diagnostic script to inspect TFLite model shapes and test inference."""
import numpy as np

try:
    import tflite_runtime.interpreter as tflite
except ImportError:
    import tensorflow as tf
    tflite = tf.lite

models = [
    ("stageA", "ml_models/stageA_model.tflite"),
    ("stageB", "ml_models/stageB_model.tflite"),
    ("stageC", "ml_models/aloe_vera_model.tflite"),
]

for name, path in models:
    try:
        interp = tflite.Interpreter(model_path=path)
        interp.allocate_tensors()
        inp = interp.get_input_details()[0]
        out = interp.get_output_details()[0]
        print(f"{name}:")
        print(f"  INPUT  shape={inp['shape']}  dtype={inp['dtype']}  quantization={inp['quantization']}")
        print(f"  OUTPUT shape={out['shape']}  dtype={out['dtype']}  quantization={out['quantization']}")

        # Run with a test all-zeros image to get baseline output
        shape = tuple(inp["shape"])
        test_arr = np.zeros(shape, dtype=np.float32)
        interp.set_tensor(inp["index"], test_arr)
        interp.invoke()
        raw_out = interp.get_tensor(out["index"])
        print(f"  Zero-image raw output: {raw_out}")

        # Run with a test all-ones image (normalized 1.0)
        test_arr2 = np.ones(shape, dtype=np.float32)
        interp.set_tensor(inp["index"], test_arr2)
        interp.invoke()
        raw_out2 = interp.get_tensor(out["index"])
        print(f"  Ones-image raw output: {raw_out2}")

        # Run with random image (simulates real input)
        np.random.seed(42)
        test_arr3 = np.random.uniform(0, 1, shape).astype(np.float32)
        interp.set_tensor(inp["index"], test_arr3)
        interp.invoke()
        raw_out3 = interp.get_tensor(out["index"])
        print(f"  Random [0,1] raw output: {raw_out3}")

        # Run with ImageNet-normalized random image
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        test_arr4 = ((test_arr3 - mean) / std).astype(np.float32)
        interp.set_tensor(inp["index"], test_arr4)
        interp.invoke()
        raw_out4 = interp.get_tensor(out["index"])
        print(f"  Random ImageNet-norm output: {raw_out4}")
        print()
    except Exception as e:
        print(f"{name} ERROR: {e}")
        print()
