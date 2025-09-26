import unittest
from Duplicado import Duplicado

class TestDuplicado(unittest.TestCase):

    def setUp(self):
        self.dup = Duplicado()

    def test_registro_unico(self):
        es_duplicado = self.dup.registrar("Supermercado", -100, "2025-09-22")
        self.assertFalse(es_duplicado)

    def test_registro_duplicado(self):
        self.dup.registrar("Supermercado", -100, "2025-09-22")
        es_duplicado = self.dup.registrar("Supermercado", -100, "2025-09-22")
        self.assertTrue(es_duplicado)

    def test_diferente_fecha(self):
        self.dup.registrar("Supermercado", -100, "2025-09-21")
        es_duplicado = self.dup.registrar("Supermercado", -100, "2025-09-22")
        self.assertFalse(es_duplicado)

    def test_diferente_monto(self):
        self.dup.registrar("Supermercado", -100, "2025-09-22")
        es_duplicado = self.dup.registrar("Supermercado", -150, "2025-09-22")
        self.assertFalse(es_duplicado)

    def test_diferente_nombre(self):
        self.dup.registrar("Supermercado", -100, "2025-09-22")
        es_duplicado = self.dup.registrar("Panadería", -100, "2025-09-22")
        self.assertFalse(es_duplicado)

    def test_descripcion_minusculas_mayusculas(self):
        # "Supermercado" y "supermercado" deben considerarse iguales
        self.dup.registrar("Supermercado", -100, "2025-09-22")
        es_duplicado = self.dup.registrar("supermercado", -100, "2025-09-22")
        self.assertTrue(es_duplicado)

    def test_descripcion_espacios(self):
        self.dup.registrar("Supermercado", -100, "2025-09-22")
        es_duplicado = self.dup.registrar("  Supermercado  ", -100, "2025-09-22")
        self.assertTrue(es_duplicado)

    def test_descripcion_vacia(self):
        self.dup.registrar("", -50, "2025-09-22")
        es_duplicado = self.dup.registrar("", -50, "2025-09-22")
        self.assertTrue(es_duplicado)

    def test_varias_transacciones(self):
        self.dup.registrar("Supermercado", -100, "2025-09-22")
        self.dup.registrar("Panadería", -50, "2025-09-22")
        self.dup.registrar("Sueldo", 2000, "2025-09-22")
        es_duplicado = self.dup.registrar("Supermercado", -100, "2025-09-22")
        self.assertTrue(es_duplicado)




if __name__ == '__main__':
    unittest.main()
