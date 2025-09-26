class Duplicado:

    def __init__(self):
        self.transacciones = set()

    def registrar(self, descripcion: str, monto: float,  fecha: str) -> bool:
        transaccion = (descripcion.strip().lower(), monto, fecha)
        if transaccion in self.transacciones:
            return True
        self.transacciones.add(transaccion)
        return False