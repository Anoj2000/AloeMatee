from pathlib import Path

import numpy as np

try:
    import tflite_runtime.interpreter as tflite
except ImportError:
    # Fall back to full TensorFlow when tflite_runtime is not installed
    import tensorflow as tf
    tflite = tf.lite


class TFLiteRunner:
    """
    Lightweight wrapper around a TFLite Interpreter.

    Usage
    -----
    runner = TFLiteRunner(path="ml_models/stageA_model.tflite")
    output = runner.predict(input_array)   # shape: (1, H, W, 3)
    """

    def __init__(self, model_path: str | Path) -> None:
        self._path = Path(model_path)
        if not self._path.exists():
            raise FileNotFoundError(f"TFLite model not found: {self._path}")

        self._interpreter = tflite.Interpreter(model_path=str(self._path))
        self._interpreter.allocate_tensors()

        self._input_details = self._interpreter.get_input_details()
        self._output_details = self._interpreter.get_output_details()

    # ── Public API ────────────────────────────────────────────────────────────

    def predict(self, input_array: np.ndarray) -> np.ndarray:
        """
        Run inference on a single preprocessed input.

        Parameters
        ----------
        input_array : np.ndarray  shape (1, H, W, 3), dtype float32

        Returns
        -------
        np.ndarray — raw output tensor with shape (1, num_classes)
        """
        expected_shape = tuple(self._input_details[0]["shape"])
        if input_array.shape != expected_shape:
            raise ValueError(
                f"Model expects input shape {expected_shape}, "
                f"got {input_array.shape}."
            )

        self._interpreter.set_tensor(
            self._input_details[0]["index"], input_array
        )
        self._interpreter.invoke()
        return self._interpreter.get_tensor(self._output_details[0]["index"])

    @property
    def input_shape(self) -> tuple:
        return tuple(self._input_details[0]["shape"])

    @property
    def output_shape(self) -> tuple:
        return tuple(self._output_details[0]["shape"])
