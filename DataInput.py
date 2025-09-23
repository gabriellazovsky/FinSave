
class DataInput:

    @classmethod
    def input_classify(cls, param, param1):
        pass


def InputClassify(ingreso:int,clasificacion):
    alimentacion=[]
    ocio=[]
    transporte=[]
    salud=[]
    familiar=[]
    inversiones=[]
    otro=[]

    if(clasificacion == "Comida"):
        alimentacion.append(ingreso)
        return alimentacion
    elif(clasificacion == "Ocio"):
        ocio.append(ingreso)
        return ocio
    elif(clasificacion == "Transporte"):
        transporte.append(ingreso)
        return transporte
    elif(clasificacion == "Salud"):
        salud.append(ingreso)
        return salud
    elif(clasificacion == "Familiar"):
        familiar.append(ingreso)
        return familiar
    elif(clasificacion == "Inversiones"):
        inversiones.append(ingreso)
        return inversiones
    elif(clasificacion == "Otro"):
        otro.append(ingreso)
        return otro
    else:
        raise ValueError("Clasificacion no valida")