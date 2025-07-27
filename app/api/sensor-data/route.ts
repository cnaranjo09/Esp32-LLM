import { type NextRequest, NextResponse } from "next/server"

// Simulamos una base de datos en memoria (en producción usa una DB real)
let sensorDataStore: any[] = []

export async function GET() {
  try {
    // Ordenar por timestamp descendente (más reciente primero)
    const sortedData = sensorDataStore.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json(sortedData)
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener datos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar datos requeridos (compatible con tu ESP32)
    if (body.value === undefined && !body.temperature && !body.humidity && !body.voltage) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    // Crear nuevo registro compatible con ambos formatos
    const newData = {
      id: Date.now().toString(),
      // Si viene del ESP32 con LDR
      lightLevel: body.value !== undefined ? Number.parseInt(body.value) : null,
      // Si vienen datos adicionales de sensores
      temperature: body.temperature ? Number.parseFloat(body.temperature) : null,
      humidity: body.humidity ? Number.parseFloat(body.humidity) : null,
      voltage: body.voltage ? Number.parseFloat(body.voltage) : null,
      timestamp: new Date().toISOString(),
    }

    // Agregar a la "base de datos"
    sensorDataStore.unshift(newData)

    // Mantener solo los últimos 100 registros
    if (sensorDataStore.length > 100) {
      sensorDataStore = sensorDataStore.slice(0, 100)
    }

    console.log("Nuevos datos recibidos:", newData)

    return NextResponse.json({
      success: true,
      message: "Datos guardados correctamente",
      data: newData,
    })
  } catch (error) {
    console.error("Error al procesar datos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
