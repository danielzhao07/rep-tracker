import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

interface FormFeedbackPanelProps {
  feedback: string[]
  formScore: number
}

export function FormFeedbackPanel({ feedback, formScore }: FormFeedbackPanelProps) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-cyan-400'
    if (score >= 40) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getFeedbackIcon = (text: string) => {
    if (text.includes('Good') || text.includes('Great')) {
      return <CheckCircle size={14} className="text-cyan-400 flex-shrink-0" />
    }
    if (
      text.includes('sagging') ||
      text.includes('Lower') ||
      text.includes('too far')
    ) {
      return <XCircle size={14} className="text-red-400 flex-shrink-0" />
    }
    return <AlertTriangle size={14} className="text-yellow-400 flex-shrink-0" />
  }

  return (
    <div className="bg-dark-800 rounded-lg border border-gray-600 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-300">Form Quality</span>
        <span className={`text-lg font-bold ${getScoreColor(formScore)}`}>
          {formScore}/100
        </span>
      </div>
      <div className="space-y-1.5">
        {feedback.map((text, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
            {getFeedbackIcon(text)}
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
