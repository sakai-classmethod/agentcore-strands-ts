import { Agent, BedrockModel, tool } from '@strands-agents/sdk'
import { Hono } from 'hono'
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

const app = new Hono()

app.get('/ping', (c) =>
  c.json({
    status: 'Healthy',
    time_of_last_update: Math.floor(Date.now() / 1000),
  })
)

app.post('/invocations', async (c) => {
  try {
    const prompt = await c.req.text()
    console.log(`Received prompt: ${prompt}`)

    const result = await agentWithTools.invoke(prompt)
    console.log(`Response stopReason: ${result.stopReason}`)

    return c.json({ response: result })
  } catch (err) {
    console.error('Error processing request:', err)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default {
  fetch: app.fetch,
  port: Number(PORT),
}

console.log(`AgentCore Runtime server listening on port ${PORT}`)

export { runInvoke, runStreaming, defaultAgent, agentWithoutTools, agentWithTools }
