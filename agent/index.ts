import { Agent, BedrockModel, tool } from '@strands-agents/sdk'
import type { Request, Response } from 'express'
import express from 'express'
import { z } from 'zod'

const PORT = process.env.PORT || 8080

const weatherTool = tool({
  name: 'get_weather',
  description: 'Get the current weather for a specific location.',
  inputSchema: z.object({
    location: z.string().describe('The city and state, e.g., San Francisco, CA'),
  }),
  callback: (input) => {
    const fakeWeatherData = {
      temperature: '72°F',
      conditions: 'sunny',
    }

    return `The weather in ${input.location} is ${fakeWeatherData.temperature} and ${fakeWeatherData.conditions}.`
  },
})

async function runInvoke(title: string, agent: Agent, prompt: string) {
  console.log(`--- ${title} ---`)
  console.log(`User: ${prompt}`)

  const result = await agent.invoke(prompt)

  console.log(`\nInvocation complete; stop reason was ${result.stopReason}\n`)
  return result
}

async function runStreaming(title: string, agent: Agent, prompt: string) {
  console.log(`--- ${title} ---`)
  console.log(`User: ${prompt}`)

  console.log('Agent response stream:')
  for await (const event of agent.stream(prompt)) {
    console.log('[Event]', event.type)
  }

  console.log('\nStreaming complete.\n')
}

const model = new BedrockModel({ region: 'us-east-1' })

const defaultAgent = new Agent()
const agentWithoutTools = new Agent({ model })
const agentWithTools = new Agent({
  systemPrompt:
    'You are a helpful assistant that provides weather information using the get_weather tool. Always Inform the user if you run tools.',
  model,
  tools: [weatherTool],
})

const app = express()

app.get('/ping', (_req: Request, res: Response) =>
  res.json({
    status: 'Healthy',
    time_of_last_update: Math.floor(Date.now() / 1000),
  })
)

app.post('/invocations', express.raw({ type: '*/*' }), async (req: Request, res: Response) => {
  try {
    const prompt = new TextDecoder().decode(req.body)
    console.log(`Received prompt: ${prompt}`)

    const result = await agentWithTools.invoke(prompt)
    console.log(`Response stopReason: ${result.stopReason}`)

    return res.json({ response: result })
  } catch (err) {
    console.error('Error processing request:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

app.listen(PORT, () => {
  console.log(`AgentCore Runtime server listening on port ${PORT}`)
})

export { runInvoke, runStreaming, defaultAgent, agentWithoutTools, agentWithTools }
