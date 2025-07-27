"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Activity, Thermometer, Droplets, Zap, Brain, RefreshCw, Sun, Moon } from "lucide-react"

interface SensorData {
  id: string
  lightLevel?: number
  temperature?: number
  humidity?: number
  voltage?: number
  timestamp: string
}

interface Analysis {
  summary: string
  recommendations: string[]
  alerts: string[]
}

export default function Dashboard() {
  const [sensorData, setSensorData] = useState<SensorData[]>([])
  const [latestData, setLatestData] = useState<SensorData | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch sensor data
  const fetchSensorData = async () => {
    try {
      const response = await fetch("/api/sensor-data")
      const data = await response.json()
      setSensorData(data)
      if (data.length > 0) {
        setLatestData(data[0])
      }
    } catch (error) {
      console.error("Error fetching sensor data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Analyze data with DeepSeek
  const analyzeData = async () => {
    if (sensorData.length === 0) return

    setIsAnalyzing(true)
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sensorData: sensorData.slice(0, 10) }),
      })
      const result = await response.json()
      setAnalysis(result.analysis)
    } catch (error) {
      console.error("Error analyzing data:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  useEffect(() => {
    fetchSensorData()
    // Refresh data every 5 seconds (más frecuente para el LDR)
    const interval = setInterval(fetchSensorData, 5000)
    return () => clearInterval(interval)
  }, [])

  const getLightStatus = (lightLevel: number) => {
    if (lightLevel < 500) return { status: "Muy Oscuro", variant: "destructive" as const, icon: Moon }
    if (lightLevel < 1500) return { status: "Oscuro", variant: "secondary" as const, icon: Moon }
    if (lightLevel < 3000) return { status: "Medio", variant: "default" as const, icon: Sun }
    return { status: "Muy Brillante", variant: "default" as const, icon: Sun }
  }

  const getStatusColor = (value: number, type: string) => {
    if (type === "temperature") {
      if (value < 15 || value > 35) return "destructive"
      if (value < 18 || value > 30) return "secondary"
      return "default"
    }
    if (type === "humidity") {
      if (value < 30 || value > 70) return "destructive"
      if (value < 40 || value > 60) return "secondary"
      return "default"
    }
    if (type === "voltage") {
      if (value < 3.0) return "destructive"
      if (value < 3.3) return "secondary"
      return "default"
    }
    return "default"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Cargando datos del ESP32...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard ESP32 - Monitoreo de Sensores</h1>
          <p className="text-gray-600">Datos en tiempo real de sensores IoT con análisis inteligente</p>
        </div>

        {/* Status Cards */}
        {latestData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Sensor de Luz (LDR) */}
            {latestData.lightLevel !== null && latestData.lightLevel !== undefined && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Nivel de Luz</CardTitle>
                  {(() => {
                    const { icon: Icon } = getLightStatus(latestData.lightLevel!)
                    return <Icon className="h-4 w-4 text-muted-foreground" />
                  })()}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{latestData.lightLevel}</div>
                  <div className="text-xs text-muted-foreground mb-2">0-4095 (ADC)</div>
                  <Badge variant={getLightStatus(latestData.lightLevel).variant}>
                    {getLightStatus(latestData.lightLevel).status}
                  </Badge>
                </CardContent>
              </Card>
            )}

            {/* Temperatura */}
            {latestData.temperature !== null && latestData.temperature !== undefined && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Temperatura</CardTitle>
                  <Thermometer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{latestData.temperature}°C</div>
                  <Badge variant={getStatusColor(latestData.temperature, "temperature")} className="mt-2">
                    {latestData.temperature >= 18 && latestData.temperature <= 30
                      ? "Normal"
                      : latestData.temperature < 15 || latestData.temperature > 35
                        ? "Crítico"
                        : "Advertencia"}
                  </Badge>
                </CardContent>
              </Card>
            )}

            {/* Humedad */}
            {latestData.humidity !== null && latestData.humidity !== undefined && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Humedad</CardTitle>
                  <Droplets className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{latestData.humidity}%</div>
                  <Badge variant={getStatusColor(latestData.humidity, "humidity")} className="mt-2">
                    {latestData.humidity >= 40 && latestData.humidity <= 60
                      ? "Normal"
                      : latestData.humidity < 30 || latestData.humidity > 70
                        ? "Crítico"
                        : "Advertencia"}
                  </Badge>
                </CardContent>
              </Card>
            )}

            {/* Voltaje */}
            {latestData.voltage !== null && latestData.voltage !== undefined && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Voltaje</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{latestData.voltage}V</div>
                  <Badge variant={getStatusColor(latestData.voltage, "voltage")} className="mt-2">
                    {latestData.voltage >= 3.3 ? "Normal" : latestData.voltage < 3.0 ? "Crítico" : "Advertencia"}
                  </Badge>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Data */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Datos Recientes</CardTitle>
                <CardDescription>Últimas 10 lecturas del ESP32</CardDescription>
              </div>
              <Button onClick={fetchSensorData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sensorData.slice(0, 10).map((data) => (
                  <div key={data.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Activity className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">
                          {data.lightLevel !== null && data.lightLevel !== undefined && `Luz: ${data.lightLevel}`}
                          {data.temperature !== null && data.temperature !== undefined && ` | ${data.temperature}°C`}
                          {data.humidity !== null && data.humidity !== undefined && ` | ${data.humidity}%`}
                          {data.voltage !== null && data.voltage !== undefined && ` | ${data.voltage}V`}
                        </p>
                        <p className="text-xs text-gray-500">{new Date(data.timestamp).toLocaleString("es-ES")}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {sensorData.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No hay datos disponibles. Verifica la conexión del ESP32.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  Análisis IA
                </CardTitle>
                <CardDescription>Análisis inteligente con DeepSeek</CardDescription>
              </div>
              <Button onClick={analyzeData} disabled={isAnalyzing || sensorData.length === 0} variant="outline">
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  "Analizar Datos"
                )}
              </Button>
            </CardHeader>
            <CardContent>
              {analysis ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Resumen:</h4>
                    <p className="text-sm text-gray-700">{analysis.summary}</p>
                  </div>

                  <Separator />

                  {analysis.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Recomendaciones:</h4>
                      <ul className="space-y-1">
                        {analysis.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.alerts.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-red-600">Alertas:</h4>
                      <ul className="space-y-1">
                        {analysis.alerts.map((alert, index) => (
                          <li key={index} className="text-sm text-red-700 flex items-start">
                            <span className="text-red-500 mr-2">⚠</span>
                            {alert}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Haz clic en "Analizar Datos" para obtener insights inteligentes</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Configuración ESP32</CardTitle>
            <CardDescription>Tu código actual y cómo expandirlo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Código actual */}
              <div>
                <h4 className="font-semibold mb-2">✅ Tu código actual (funcionando):</h4>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm">
                    {`// Tu código actual está perfecto para el sensor LDR
// Solo cambia la URL del servidor:
const char* serverUrl = "https://tu-dominio.vercel.app/api/sensor-data";

// El formato JSON que envías es compatible:
String jsonBody = "{\"value\":" + String(luz_invertida) + "}";`}
                  </pre>
                </div>
              </div>

              {/* Código expandido */}
              <div>
                <h4 className="font-semibold mb-2">🚀 Código expandido (múltiples sensores):</h4>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm">
                    {`#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>  // Para sensor DHT22

#define DHT_PIN 4
#define DHT_TYPE DHT22
DHT dht(DHT_PIN, DHT_TYPE);

const char* ssid = "tu_wifi";
const char* password = "tu_password";
const char* serverUrl = "https://tu-dominio.vercel.app/api/sensor-data";

void setup() {
    Serial.begin(115200);
    dht.begin();  // Inicializar DHT
    
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("¡Conectado a WiFi!");
}

void loop() {
    // Leer todos los sensores
    int luz = 4095 - analogRead(32);  // LDR invertido
    float temperatura = dht.readTemperature();
    float humedad = dht.readHumidity();
    float voltaje = (analogRead(35) * 3.3) / 4095.0;  // Pin 35 para voltaje
    
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(serverUrl);
        http.addHeader("Content-Type", "application/json");
        
        // JSON con todos los sensores
        String jsonBody = "{";
        jsonBody += "\\"value\\":" + String(luz) + ",";
        jsonBody += "\\"temperature\\":" + String(temperatura) + ",";
        jsonBody += "\\"humidity\\":" + String(humedad) + ",";
        jsonBody += "\\"voltage\\":" + String(voltaje);
        jsonBody += "}";
        
        int httpCode = http.POST(jsonBody);
        
        if (httpCode == HTTP_CODE_OK) {
            Serial.println("Datos enviados: " + jsonBody);
        } else {
            Serial.println("Error HTTP: " + String(httpCode));
        }
        
        http.end();
    }
    
    delay(2000);  // Enviar cada 2 segundos
}`}
                  </pre>
                </div>
              </div>

              {/* Conexiones de hardware */}
              <div>
                <h4 className="font-semibold mb-2">🔌 Conexiones de Hardware:</h4>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <ul className="space-y-2 text-sm">
                    <li>
                      <strong>LDR (actual):</strong> GPIO32 (ya conectado)
                    </li>
                    <li>
                      <strong>DHT22:</strong> GPIO4 (VCC, GND, Data)
                    </li>
                    <li>
                      <strong>Voltaje:</strong> GPIO35 (divisor de voltaje)
                    </li>
                    <li>
                      <strong>Alimentación:</strong> 3.3V y GND para todos los sensores
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
