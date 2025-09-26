from Duplicado import Duplicado

def main():
    sistema = Duplicado()

    print("=== Sistema de Registro Financiero ===")
    print("Ingresa tu ingreso o gasto.")
    print("Escribe 'salir' en cualquier momento para terminar.\n")

    while True:
        descripcion = input("Nombre del ingreso: ")
        if descripcion.lower() == "salir":
            break

        try:
            monto = float(input("Monto (positivo=ingreso, negativo=gasto): "))
        except ValueError:
            print("El monto debe ser un número.")
            continue

        fecha = input("Fecha (YYYY-MM-DD): ")
        if fecha.lower() == "salir":
            break

        duplicado = sistema.registrar(descripcion, monto, fecha)

        if duplicado:
            print("AVISO: Esta transacción parece estar duplicada.\n")
        else:
            print("Transacción registrada correctamente.\n")

    print("Gracias por depositar tus dineros con nosotros.")

if __name__ == "__main__":
    main()
