from unittest import TestCase

from DataInput import DataInput


class Test(TestCase):
    def test_input_classify(self):
        DataInput.input_classify(0,"Comida")
        DataInput.input_classify(0,"Ocio")
        DataInput.input_classify(0,"Transporte")
    def test_input_classify2(self):
        DataInput.input_classify(1,"aaaaaaaaa")

if __name__ == "__main__":
    import unittest
    unittest.main()
