import { useEffect, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card } from '@/components/shared/Card'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useHistoryStore } from '@/store/historyStore'
import { formatDate } from '@/utils/helpers'
import { TrendingUp, Award, Flame } from 'lucide-react'

export function AnalyticsPage() {
  const { workouts, isLoading, loadWorkouts } = useHistoryStore()

  useEffect(() => {
    loadWorkouts()
  }, [loadWorkouts])

  const chartData = useMemo(() => {
    return [...workouts]
      .reverse()
      .map((w) => ({
        date: formatDate(w.createdAt),
        reps: w.repCount,
        formScore: w.formScore ?? 0,
      }))
  }, [workouts])

  const stats = useMemo(() => {
    if (workouts.length === 0)
      return { totalReps: 0, totalWorkouts: 0, bestReps: 0, avgFormScore: 0 }

    const totalReps = workouts.reduce((sum, w) => sum + w.repCount, 0)
    const bestReps = Math.max(...workouts.map((w) => w.repCount))
    const scoresWithData = workouts.filter((w) => w.formScore !== null)
    const avgFormScore =
      scoresWithData.length > 0
        ? Math.round(
            scoresWithData.reduce((sum, w) => sum + (w.formScore ?? 0), 0) /
              scoresWithData.length
          )
        : 0

    return {
      totalReps,
      totalWorkouts: workouts.length,
      bestReps,
      avgFormScore,
    }
  }, [workouts])

  if (isLoading && workouts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <div className="flex items-center gap-3">
            <Flame className="text-cyan-400" size={24} />
            <div>
              <p className="text-2xl font-bold">{stats.totalWorkouts}</p>
              <p className="text-sm text-gray-400">Workouts</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <TrendingUp className="text-cyan-400" size={24} />
            <div>
              <p className="text-2xl font-bold">{stats.totalReps}</p>
              <p className="text-sm text-gray-400">Total Reps</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <Award className="text-cyan-400" size={24} />
            <div>
              <p className="text-2xl font-bold">{stats.bestReps}</p>
              <p className="text-sm text-gray-400">Best Set</p>
            </div>
          </div>
        </Card>
        <Card>
          <div>
            <p className="text-2xl font-bold text-cyan-400">
              {stats.avgFormScore}
            </p>
            <p className="text-sm text-gray-400">Avg Form Score</p>
          </div>
        </Card>
      </div>

      {chartData.length > 1 ? (
        <div className="space-y-8">
          <Card>
            <h3 className="text-sm font-medium text-gray-300 mb-4">
              Reps Over Time
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                  <XAxis
                    dataKey="date"
                    stroke="#6a6a6a"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#6a6a6a"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #3a3a3a',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="reps"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-gray-300 mb-4">
              Form Score Trend
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                  <XAxis
                    dataKey="date"
                    stroke="#6a6a6a"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#6a6a6a"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #3a3a3a',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="formScore"
                    stroke="#34d399"
                    strokeWidth={2}
                    dot={{ fill: '#34d399', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <TrendingUp className="mx-auto text-gray-500 mb-4" size={48} />
            <p className="text-gray-400 text-lg">Not enough data yet</p>
            <p className="text-gray-500 text-sm mt-1">
              Complete at least 2 workouts to see trends
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
