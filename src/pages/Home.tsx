import { Button } from "antd"
import { tracker } from "../utils/tracker"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Button onClick={() => {
        tracker.log('test', { message: 'test log' })
      }}>test log</Button>

      <Button onClick={() => {
        tracker.sendReport('test')
      }}>test send report</Button>
      <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
        Welcome to Invitation App
      </h1>
      <p className="text-lg text-gray-600 pr-20">
        Start building your amazing application.
      </p>
    </div>
  )
}
