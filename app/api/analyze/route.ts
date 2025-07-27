import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

// Configurar DeepSeek
const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || "",
  baseURL: "https://api.deepseek.com/v1",
})

export async function POST(request: NextRequest) {
  try {
    const { sensorData } = await request.json()

    if (!sensorData || sensorData.length === 0) {
      return NextResponse.json({ error: "No hay datos para analizar" }, { status: 400 })
    }

    // Preparar datos para el análisis
    const dataForAnalysis = sensorData.map((data: any) => ({
      lightLevel: data.lightLevel,
      temperature: data.temperature,
      humidity: data.humidity,
      voltage: data.voltage,
      timestamp: data.timestamp,
    }))

    const prompt = `
Analiza los siguientes datos de sensores IoT de un ESP32:

${JSON.stringify(dataForAnalysis, null, 2)}

Los sensores incluyen:
- Sensor LDR (lightLevel): Mide nivel de luz ambiente (0-4095, donde 0=oscuro, 4095=muy brillante)
- Temperatura: En grados Celsius (si está disponible)
- Humedad: En porcentaje (si está disponible)  
- Voltaje: Voltaje de alimentación (si está disponible)

Por favor proporciona:
1. Un resumen del estado general de los sensores
2. Recomendaciones específicas basadas en los datos
3. Alertas si hay valores fuera de rangos normales

Rangos normales:
- Nivel de luz: 500-3500 (crítico: <200 muy oscuro, >3800 demasiado brillante)
- Temperatura: 18-30°C (crítico: <15°C o >35°C)
- Humedad: 40-60% (crítico: <30% o >70%)
- Voltaje: >3.3V (crítico: <3.0V)

Responde en formato JSON con esta estructura:
{
  "summary": "resumen general incluyendo patrones de luz y otros sensores",
  "recommendations": ["recomendación 1", "recomendación 2"],
  "alerts": ["alerta 1", "alerta 2"]
}
`

    const { text } = await generateText({
      model: deepseek("deepseek-chat"),
      prompt: prompt,
      temperature: 0.3,
    })

    // Intentar parsear la respuesta JSON
    let analysis
    try {
      analysis = JSON.parse(text)
    } catch (parseError) {
      // Si no es JSON válido, crear estructura básica
      analysis = {
        summary: text,
        recommendations: [],
        alerts: [],
      }
    }

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error("Error en análisis:", error)
    return NextResponse.json({ error: "Error al analizar datos con IA" }, { status: 500 })
  }
}
