import { useEffect, useState, useMemo } from 'react'
import { Card } from '@/components/shared/Card'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Modal } from '@/components/shared/Modal'
import { MuscleDistributionChart } from '@/components/charts/MuscleDistributionChart'
import { LineChart } from '@/components/charts/LineChart'
import { useHistoryStore } from '@/store/historyStore'
import { VideoStorageRepository } from '@/repositories/VideoStorageRepository'
import { formatDuration, formatDate, formatTime } from '@/utils/helpers'
import { EXERCISES_SEED } from '@/utils/constants'
import { Calendar, Clock, Target, Trash2, Video, Play, TrendingUp, ChevronDown, ChevronRight, BarChart3 } from 'lucide-react'

export function HistoryPage() {
  const { workouts, isLoading, error, loadWorkouts, deleteWorkout } =
    useHistoryStore()
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null)
  const [selectedWorkoutName, setSelectedWorkoutName] = useState<string>('')
  const [isLoadingVideo, setIsLoadingVideo] = useState(false)
  const [activeSection, setActiveSection] = useState<'workouts' | 'statistics' | 'videos'>('workouts')
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set())
  const [showVideoStats, setShowVideoStats] = useState(false)
  const [videoStatsView, setVideoStatsView] = useState<'stats' | 'charts'>('stats')
  const [statsView, setStatsView] = useState<'calendar' | 'charts'>('calendar')
  const [calendarView, setCalendarView] = useState<'month' | 'year'>('month')
  const [calendarDropdownOpen, setCalendarDropdownOpen] = useState(false)
  const [muscleDistributionPeriod, setMuscleDistributionPeriod] = useState<'week' | 'month' | '3months' | 'year'>('month')
  const [muscleDistributionDropdownOpen, setMuscleDistributionDropdownOpen] = useState(false)

  useEffect(() => {
    loadWorkouts()
  }, [loadWorkouts])

  const getExerciseName = (exerciseId: string) => {
    return (
      EXERCISES_SEED.find((e) => e.id === exerciseId)?.name || 'Unknown Exercise'
    )
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const totalWorkouts = workouts.length
    const totalReps = workouts.reduce((sum, w) => sum + w.repCount, 0)
    const totalDuration = workouts.reduce((sum, w) => sum + (w.durationMs || 0), 0)
    const videoWorkouts = workouts.filter(w => w.videoUrl).length
    const avgFormScore = videoWorkouts > 0 
      ? workouts.filter(w => w.formScore !== null).reduce((sum, w) => sum + (w.formScore || 0), 0) / workouts.filter(w => w.formScore !== null).length
      : 0
    
    // Calculate workout days and streak
    const workoutDates = new Set(
      workouts.map(w => new Date(w.createdAt).toDateString())
    )
    
    // Calculate streak
    let currentStreak = 0
    let restDays = 0
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      const hasWorkout = workoutDates.has(checkDate.toDateString())
      
      if (hasWorkout) {
        currentStreak++
        restDays = 0
      } else {
        if (currentStreak === 0) {
          restDays++
        } else {
          break
        }
      }
    }
    
    // Get current and previous month data
    const now2 = new Date()
    const currentMonth = now2.getMonth()
    const currentYear = now2.getFullYear()
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
    
    const generateMonthCalendar = (year: number, month: number) => {
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const firstDayOfMonth = new Date(year, month, 1).getDay()
      
      const calendarDays = []
      for (let i = 0; i < firstDayOfMonth; i++) {
        calendarDays.push(null)
      }
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day)
        const hasWorkout = workoutDates.has(date.toDateString())
        const isToday = year === now2.getFullYear() && month === now2.getMonth() && day === now2.getDate()
        calendarDays.push({ day, hasWorkout, isToday })
      }
      return calendarDays
    }
    
    const currentMonthCalendar = generateMonthCalendar(currentYear, currentMonth)
    const prevMonthCalendar = generateMonthCalendar(prevYear, prevMonth)
    
    // Generate year view (all 12 months)
    const yearCalendar = []
    for (let month = 0; month < 12; month++) {
      yearCalendar.push({
        month,
        calendar: generateMonthCalendar(currentYear, month)
      })
    }
    
    return {
      totalWorkouts,
      totalReps,
      totalDuration,
      videoWorkouts,
      avgFormScore: Math.round(avgFormScore),
      workoutDays: workoutDates.size,
      currentStreak,
      restDays,
      currentMonthCalendar,
      prevMonthCalendar,
      yearCalendar,
      currentMonth,
      currentYear,
      prevMonth,
      prevYear
    }
  }, [workouts])

  // Calculate muscle distribution and period stats based on selected period
  const { muscleDistribution, periodStats, previousPeriodStats } = useMemo(() => {
    const now = new Date()
    let startDate: Date
    let previousStartDate: Date
    let previousEndDate: Date
    
    switch (muscleDistributionPeriod) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
        previousEndDate = startDate
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
        previousEndDate = startDate
        break
      case '3months':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        previousStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
        previousEndDate = startDate
        break
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        previousStartDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000)
        previousEndDate = startDate
        break
    }
    
    const filteredWorkouts = workouts.filter(w => new Date(w.createdAt) >= startDate)
    const previousWorkouts = workouts.filter(w => {
      const date = new Date(w.createdAt)
      return date >= previousStartDate && date < previousEndDate
    })
    
    // Calculate muscle distribution
    const muscleGroups = ['Back', 'Chest', 'Core', 'Shoulders', 'Arms', 'Legs']
    const muscleDistributionData: Record<string, number> = {}
    
    filteredWorkouts.forEach(workout => {
      const exercise = EXERCISES_SEED.find(e => e.id === workout.exerciseId)
      if (exercise) {
        // Map exercise type to muscle group category
        let category = 'Core'
        const name = exercise.name.toLowerCase()
        
        // Simple name-based mapping
        if (name.includes('push-up') || name.includes('pushup') || name.includes('bench')) {
          category = 'Chest'
        } else if (name.includes('bicep') || name.includes('curl') || name.includes('tricep')) {
          category = 'Arms'
        } else if (name.includes('squat') || name.includes('leg') || name.includes('lunge')) {
          category = 'Legs'
        } else if (name.includes('shoulder') || name.includes('press') && !name.includes('bench')) {
          category = 'Shoulders'
        } else if (name.includes('row') || name.includes('pull') || name.includes('deadlift')) {
          category = 'Back'
        } else if (name.includes('ab') || name.includes('crunch') || name.includes('plank')) {
          category = 'Core'
        }
        
        muscleDistributionData[category] = (muscleDistributionData[category] || 0) + workout.repCount
      }
    })
    
    // Normalize to percentage
    const maxReps = Math.max(...Object.values(muscleDistributionData), 1)
    const distribution = muscleGroups.map(group => ({
      name: group,
      value: ((muscleDistributionData[group] || 0) / maxReps) * 100
    }))
    
    // Calculate period stats
    const currentWorkouts = filteredWorkouts.length
    const currentDuration = filteredWorkouts.reduce((sum, w) => sum + (w.durationMs || 0), 0)
    const currentReps = filteredWorkouts.reduce((sum, w) => sum + w.repCount, 0)
    const currentVideos = filteredWorkouts.filter(w => w.videoUrl).length
    const currentSets = filteredWorkouts.length // Each workout is a set
    
    // Volume calculation - only count weighted exercises, ignore bodyweight
    const currentVolume = filteredWorkouts.reduce((sum, w) => {
      const exercise = EXERCISES_SEED.find(e => e.id === w.exerciseId)
      const name = exercise?.name.toLowerCase() || ''
      // Skip pure bodyweight exercises
      if (name.includes('push-up') || name.includes('pushup') || 
          name.includes('squat') && !name.includes('barbell') && !name.includes('dumbbell') ||
          name.includes('pull-up') || name.includes('chin-up') || name.includes('dip') && !name.includes('weighted')) {
        return sum
      }
      // For weighted exercises, use estimated weight
      const isLegExercise = name.includes('leg') || name.includes('deadlift')
      const estimatedWeight = isLegExercise ? 135 : 45
      return sum + (w.repCount * estimatedWeight)
    }, 0)
    
    const prevWorkouts = previousWorkouts.length
    const prevDuration = previousWorkouts.reduce((sum, w) => sum + (w.durationMs || 0), 0)
    const prevReps = previousWorkouts.reduce((sum, w) => sum + w.repCount, 0)
    const prevVideos = previousWorkouts.filter(w => w.videoUrl).length
    const prevSets = previousWorkouts.length
    const prevVolume = previousWorkouts.reduce((sum, w) => {
      const exercise = EXERCISES_SEED.find(e => e.id === w.exerciseId)
      const name = exercise?.name.toLowerCase() || ''
      if (name.includes('push-up') || name.includes('pushup') || 
          name.includes('squat') && !name.includes('barbell') && !name.includes('dumbbell') ||
          name.includes('pull-up') || name.includes('chin-up') || name.includes('dip') && !name.includes('weighted')) {
        return sum
      }
      const isLegExercise = name.includes('leg') || name.includes('deadlift')
      const estimatedWeight = isLegExercise ? 135 : 45
      return sum + (w.repCount * estimatedWeight)
    }, 0)
    
    return {
      muscleDistribution: distribution,
      periodStats: {
        workouts: currentWorkouts,
        duration: currentDuration,
        reps: currentReps,
        volume: currentVolume,
        videos: currentVideos,
        sets: currentSets
      },
      previousPeriodStats: {
        workouts: prevWorkouts,
        duration: prevDuration,
        reps: prevReps,
        volume: prevVolume,
        videos: prevVideos,
        sets: prevSets
      }
    }
  }, [workouts, muscleDistributionPeriod])

  // Group video workouts by exercise
  const videoWorkoutsByExercise = useMemo(() => {
    const grouped = new Map<string, typeof workouts>()
    workouts
      .filter(w => w.videoUrl)
      .forEach(workout => {
        const exerciseName = getExerciseName(workout.exerciseId)
        if (!grouped.has(exerciseName)) {
          grouped.set(exerciseName, [])
        }
        grouped.get(exerciseName)!.push(workout)
      })
    return grouped
  }, [workouts])

  const handlePlayVideo = async (videoUrl: string, exerciseName: string) => {
    setIsLoadingVideo(true)
    setSelectedWorkoutName(exerciseName)
    
    try {
      // Get signed URL for playback
      const videoRepo = new VideoStorageRepository()
      const playableUrl = await videoRepo.getVideoUrl(videoUrl)
      setSelectedVideoUrl(playableUrl)
    } catch (err) {
      console.error('Failed to get video URL:', err)
      // Try using the original URL as fallback
      setSelectedVideoUrl(videoUrl)
    } finally {
      setIsLoadingVideo(false)
    }
  }

  const handleCloseVideo = () => {
    setSelectedVideoUrl(null)
    setSelectedWorkoutName('')
  }

  const toggleExercise = (exerciseName: string) => {
    const newExpanded = new Set(expandedExercises)
    if (newExpanded.has(exerciseName)) {
      newExpanded.delete(exerciseName)
    } else {
      newExpanded.add(exerciseName)
    }
    setExpandedExercises(newExpanded)
  }

  // Video stats
  const videoStats = useMemo(() => {
    const videoWorkoutsArray = workouts.filter(w => w.videoUrl)
    const avgFormScore = videoWorkoutsArray.filter(w => w.formScore !== null).length > 0
      ? Math.round(videoWorkoutsArray.filter(w => w.formScore !== null).reduce((sum, w) => sum + (w.formScore || 0), 0) / videoWorkoutsArray.filter(w => w.formScore !== null).length)
      : 0
    const totalDuration = videoWorkoutsArray.reduce((sum, w) => sum + (w.durationMs || 0), 0)
    const avgReps = videoWorkoutsArray.length > 0 ? Math.round(videoWorkoutsArray.reduce((sum, w) => sum + w.repCount, 0) / videoWorkoutsArray.length) : 0
    
    // Get form scores over time for chart
    const formScoreData = videoWorkoutsArray
      .filter(w => w.formScore !== null)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((w, index) => ({
        index: index + 1,
        score: w.formScore || 0,
        date: formatDate(w.createdAt)
      }))
    
    // Get reps over time for chart
    const repsData = videoWorkoutsArray
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((w, index) => ({
        index: index + 1,
        reps: w.repCount,
        date: formatDate(w.createdAt)
      }))
    
    return {
      totalVideos: videoWorkoutsArray.length,
      avgFormScore,
      totalDuration,
      avgReps,
      formScoreData,
      repsData
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
    <div className="pb-6">
      <h1 className="text-2xl font-bold mb-6">History</h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400 mb-4">
          {error}
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveSection('workouts')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${
            activeSection === 'workouts'
              ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/30'
              : 'bg-dark-700 text-gray-400 hover:text-cyan-300 hover:bg-dark-600 border border-cyan-700/20'
          }`}
        >
          Workout History
        </button>
        <button
          onClick={() => setActiveSection('statistics')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${
            activeSection === 'statistics'
              ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/30'
              : 'bg-dark-700 text-gray-400 hover:text-cyan-300 hover:bg-dark-600 border border-cyan-700/20'
          }`}
        >
          Statistics
        </button>
        <button
          onClick={() => setActiveSection('videos')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${
            activeSection === 'videos'
              ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/30'
              : 'bg-dark-700 text-gray-400 hover:text-cyan-300 hover:bg-dark-600 border border-cyan-700/20'
          }`}
        >
          Videos
        </button>
      </div>

      {/* Workout History Section */}
      {activeSection === 'workouts' && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-white">Recent Workouts</h2>
          {workouts.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Target className="mx-auto text-gray-500 mb-4" size={48} />
                <p className="text-gray-400 text-lg">No workouts yet</p>
                <p className="text-gray-500 text-sm mt-1">
                  Complete a workout to see it here
                </p>
              </div>
            </Card>
          ) : (
            <div className="bg-dark-800 rounded-lg p-4 mb-4">
              <p className="text-gray-400 text-sm">
                Routine history will be displayed here once routines are implemented.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Statistics Section */}
      {activeSection === 'statistics' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Your Stats</h2>
            
            {/* View Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setStatsView('calendar')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  statsView === 'calendar'
                    ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                    : 'bg-dark-700 text-gray-400 hover:text-cyan-300 hover:bg-dark-600 border border-cyan-700/20'
                }`}
              >
                <Calendar className="w-5 h-5" />
              </button>
              <button
                onClick={() => setStatsView('charts')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  statsView === 'charts'
                    ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                    : 'bg-dark-700 text-gray-400 hover:text-cyan-300 hover:bg-dark-600 border border-cyan-700/20'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {statsView === 'calendar' ? (
            <>
              {/* Streak Info */}
              <div className="flex gap-4">
                <div className="flex items-center gap-2 bg-dark-800 rounded-lg px-4 py-2">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <p className="text-white font-semibold">{stats.currentStreak} day streak</p>
                    <p className="text-xs text-gray-400">Keep it up!</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-dark-800 rounded-lg px-4 py-2">
                  <span className="text-2xl">🌙</span>
                  <div>
                    <p className="text-white font-semibold">{stats.restDays} rest days</p>
                    <p className="text-xs text-gray-400">Recovery time</p>
                  </div>
                </div>
              </div>

              {/* Calendar View Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setCalendarDropdownOpen(!calendarDropdownOpen)}
                  className="w-full bg-dark-800 rounded-lg px-4 py-3 flex items-center justify-between text-white hover:bg-dark-700 transition-colors"
                >
                  <span className="font-medium">
                    {calendarView === 'month' ? 'Month' : 'Year'}
                  </span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${calendarDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {calendarDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-dark-800 rounded-lg shadow-lg border border-dark-700 z-10">
                    <button
                      onClick={() => {
                        setCalendarView('month')
                        setCalendarDropdownOpen(false)
                      }}
                      className="w-full px-4 py-3 text-left text-white hover:bg-dark-700 transition-colors first:rounded-t-lg"
                    >
                      Month
                    </button>
                    <button
                      onClick={() => {
                        setCalendarView('year')
                        setCalendarDropdownOpen(false)
                      }}
                      className="w-full px-4 py-3 text-left text-white hover:bg-dark-700 transition-colors last:rounded-b-lg"
                    >
                      Year
                    </button>
                  </div>
                )}
              </div>

              {/* Month View - Show 2 months */}
              {calendarView === 'month' && (
                <div className="space-y-6">
                  {/* Current Month */}
                  <Card>
                    <h3 className="text-white font-semibold mb-4">
                      {new Date(stats.currentYear, stats.currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                    
                    <div className="grid grid-cols-7 gap-2">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={i} className="text-center text-xs text-gray-500 font-medium py-1">
                          {day}
                        </div>
                      ))}
                      
                      {stats.currentMonthCalendar.map((day, i) => (
                        <div
                          key={i}
                          className={`aspect-square flex items-center justify-center text-sm rounded-lg ${
                            !day
                              ? ''
                              : day.isToday
                              ? 'bg-cyan-500/20 text-cyan-400 font-semibold ring-2 ring-cyan-500 shadow-lg shadow-cyan-500/30'
                              : day.hasWorkout
                              ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                              : 'text-gray-400'
                          }`}
                        >
                          {day?.day}
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Previous Month */}
                  <Card>
                    <h3 className="text-white font-semibold mb-4">
                      {new Date(stats.prevYear, stats.prevMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                    
                    <div className="grid grid-cols-7 gap-2">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={i} className="text-center text-xs text-gray-500 font-medium py-1">
                          {day}
                        </div>
                      ))}
                      
                      {stats.prevMonthCalendar.map((day, i) => (
                        <div
                          key={i}
                          className={`aspect-square flex items-center justify-center text-sm rounded-lg ${
                            !day
                              ? ''
                              : day.hasWorkout
                              ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                              : 'text-gray-400'
                          }`}
                        >
                          {day?.day}
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Legend */}
                  <div className="flex items-center gap-4 text-xs px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-cyan-500/20 border border-cyan-500/40" />
                      <span className="text-gray-400">Workout Day</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-cyan-500/20 ring-2 ring-cyan-500" />
                      <span className="text-gray-400">Today</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Year View - Show all 12 months */}
              {calendarView === 'year' && (
                <Card>
                  <h3 className="text-white font-semibold mb-6 text-center text-xl">
                    {stats.currentYear}
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stats.yearCalendar.map(({ month, calendar }) => (
                      <div key={month}>
                        <h4 className="text-white font-medium mb-2 text-center text-sm">
                          {new Date(stats.currentYear, month).toLocaleDateString('en-US', { month: 'short' })}
                        </h4>
                        <div className="grid grid-cols-7 gap-1">
                          {calendar.map((day, i) => (
                            <div
                              key={i}
                              className={`aspect-square flex items-center justify-center text-[10px] rounded ${
                                !day
                                  ? ''
                                  : day.isToday
                                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                                  : day.hasWorkout
                                  ? 'bg-cyan-500/30 text-cyan-300'
                                  : 'bg-gray-800 text-gray-600'
                              }`}
                            >
                              {day?.day}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          ) : (
            <>
              {/* Charts View */}
              {/* Muscle Distribution */}
              <Card>
                {/* Period Dropdown */}
                <div className="relative mb-6">
                  <button
                    onClick={() => setMuscleDistributionDropdownOpen(!muscleDistributionDropdownOpen)}
                    className="w-full bg-dark-800 text-white px-4 py-3 rounded-xl flex items-center justify-between"
                  >
                    <span>
                      {muscleDistributionPeriod === 'week' && 'Last 7 days'}
                      {muscleDistributionPeriod === 'month' && 'Last 30 days'}
                      {muscleDistributionPeriod === '3months' && 'Last 3 months'}
                      {muscleDistributionPeriod === 'year' && 'Last year'}
                    </span>
                    <ChevronDown className={`w-5 h-5 transition-transform ${
                      muscleDistributionDropdownOpen ? 'rotate-180' : ''
                    }`} />
                  </button>
                  
                  {muscleDistributionDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-dark-800 rounded-xl overflow-hidden z-10 border border-dark-700">
                      <button
                        onClick={() => {
                          setMuscleDistributionPeriod('week')
                          setMuscleDistributionDropdownOpen(false)
                        }}
                        className="w-full px-4 py-3 text-left text-white hover:bg-dark-700 transition-colors"
                      >
                        Last 7 days
                      </button>
                      <button
                        onClick={() => {
                          setMuscleDistributionPeriod('month')
                          setMuscleDistributionDropdownOpen(false)
                        }}
                        className="w-full px-4 py-3 text-left text-white hover:bg-dark-700 transition-colors"
                      >
                        Last 30 days
                      </button>
                      <button
                        onClick={() => {
                          setMuscleDistributionPeriod('3months')
                          setMuscleDistributionDropdownOpen(false)
                        }}
                        className="w-full px-4 py-3 text-left text-white hover:bg-dark-700 transition-colors"
                      >
                        Last 3 months
                      </button>
                      <button
                        onClick={() => {
                          setMuscleDistributionPeriod('year')
                          setMuscleDistributionDropdownOpen(false)
                        }}
                        className="w-full px-4 py-3 text-left text-white hover:bg-dark-700 transition-colors"
                      >
                        Last year
                      </button>
                    </div>
                  )}
                </div>
                
                <MuscleDistributionChart data={muscleDistribution} />
                
                {/* Period Stats Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="bg-dark-800">
                    <h4 className="text-gray-400 text-sm mb-1">Workouts</h4>
                    <p className="text-white text-2xl font-semibold">{periodStats.workouts}</p>
                    <p className={`text-sm flex items-center gap-1 ${
                      periodStats.workouts >= previousPeriodStats.workouts ? 'text-cyan-400' : 'text-red-400'
                    }`}>
                      <TrendingUp className="w-4 h-4" />
                      {periodStats.workouts - previousPeriodStats.workouts >= 0 ? '+' : ''}{periodStats.workouts - previousPeriodStats.workouts}
                    </p>
                  </Card>
                  
                  <Card className="bg-dark-800">
                    <h4 className="text-gray-400 text-sm mb-1">Duration</h4>
                    <p className="text-white text-2xl font-semibold">
                      {Math.floor(periodStats.duration / 60000)}min
                    </p>
                    <p className={`text-sm flex items-center gap-1 ${
                      periodStats.duration >= previousPeriodStats.duration ? 'text-cyan-400' : 'text-red-400'
                    }`}>
                      <TrendingUp className="w-4 h-4" />
                      {Math.floor((periodStats.duration - previousPeriodStats.duration) / 60000) >= 0 ? '+' : ''}{Math.floor((periodStats.duration - previousPeriodStats.duration) / 60000)}min
                    </p>
                  </Card>
                  
                  <Card className="bg-dark-800">
                    <h4 className="text-gray-400 text-sm mb-1">Reps</h4>
                    <p className="text-white text-2xl font-semibold">{periodStats.reps}</p>
                    <p className={`text-sm flex items-center gap-1 ${
                      periodStats.reps >= previousPeriodStats.reps ? 'text-cyan-400' : 'text-red-400'
                    }`}>
                      <TrendingUp className="w-4 h-4" />
                      {periodStats.reps - previousPeriodStats.reps >= 0 ? '+' : ''}{periodStats.reps - previousPeriodStats.reps}
                    </p>
                  </Card>
                  
                  <Card className="bg-dark-800">
                    <h4 className="text-gray-400 text-sm mb-1">Sets</h4>
                    <p className="text-white text-2xl font-semibold">{periodStats.sets}</p>
                    <p className={`text-sm flex items-center gap-1 ${
                      periodStats.sets >= previousPeriodStats.sets ? 'text-cyan-400' : 'text-red-400'
                    }`}>
                      <TrendingUp className="w-4 h-4" />
                      {periodStats.sets - previousPeriodStats.sets >= 0 ? '+' : ''}{periodStats.sets - previousPeriodStats.sets}
                    </p>
                  </Card>
                  
                  {periodStats.volume > 0 && (
                    <Card className="bg-dark-800">
                      <h4 className="text-gray-400 text-sm mb-1">Volume</h4>
                      <p className="text-white text-2xl font-semibold">{periodStats.volume} lbs</p>
                      <p className={`text-sm flex items-center gap-1 ${
                        periodStats.volume >= previousPeriodStats.volume ? 'text-cyan-400' : 'text-red-400'
                      }`}>
                        <TrendingUp className="w-4 h-4" />
                        {periodStats.volume - previousPeriodStats.volume >= 0 ? '+' : ''}{periodStats.volume - previousPeriodStats.volume} lbs
                      </p>
                    </Card>
                  )}
                  
                  <Card className="bg-dark-800">
                    <h4 className="text-gray-400 text-sm mb-1">Videos</h4>
                    <p className="text-white text-2xl font-semibold">{periodStats.videos}</p>
                    <p className={`text-sm flex items-center gap-1 ${
                      periodStats.videos >= previousPeriodStats.videos ? 'text-cyan-400' : 'text-red-400'
                    }`}>
                      <TrendingUp className="w-4 h-4" />
                      {periodStats.videos - previousPeriodStats.videos >= 0 ? '+' : ''}{periodStats.videos - previousPeriodStats.videos}
                    </p>
                  </Card>
                </div>
              </Card>

              {/* Progression Chart Placeholder */}
              <Card>
                <h3 className="text-white font-semibold mb-4">Workout Progression</h3>
                <div className="h-48 flex items-center justify-center">
                  <p className="text-gray-500 text-sm">Progression charts coming soon</p>
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Videos Section */}
      {activeSection === 'videos' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Video Workouts</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowVideoStats(!showVideoStats)}
                className="flex items-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm">Stats</span>
              </button>
              
              {showVideoStats && (
                <div className="flex gap-1 bg-dark-900 rounded-lg p-1">
                  <button
                    onClick={() => setVideoStatsView('stats')}
                    className={`px-3 py-1 text-sm rounded transition-all duration-200 ${
                      videoStatsView === 'stats'
                        ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                        : 'text-gray-400 hover:text-cyan-300 hover:bg-dark-600'
                    }`}
                  >
                    Stats
                  </button>
                  <button
                    onClick={() => setVideoStatsView('charts')}
                    className={`px-3 py-1 text-sm rounded transition-all duration-200 ${
                      videoStatsView === 'charts'
                        ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                        : 'text-gray-400 hover:text-cyan-300 hover:bg-dark-600'
                    }`}
                  >
                    Charts
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Video Stats Modal */}
          {showVideoStats && videoStatsView === 'stats' && (
            <Card className="mb-6">
              <h3 className="text-white font-semibold mb-4">Video Workout Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Total Videos</p>
                  <p className="text-2xl font-bold text-white">{videoStats.totalVideos}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Avg Form Score</p>
                  <p className="text-2xl font-bold text-cyan-400">{videoStats.avgFormScore}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Duration</p>
                  <p className="text-2xl font-bold text-white">{Math.floor(videoStats.totalDuration / 60000)}min</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Avg Reps/Video</p>
                  <p className="text-2xl font-bold text-white">{videoStats.avgReps}</p>
                </div>
              </div>
            </Card>
          )}
          
          {/* Video Stats Charts */}
          {showVideoStats && videoStatsView === 'charts' && (
            <Card className="mb-6">
              <h3 className="text-white font-semibold mb-6">Video Workout Trends</h3>
              
              {/* Form Score Chart */}
              {videoStats.formScoreData.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-cyan-400 text-sm mb-4 font-medium">Form Score Progress</h4>
                  <LineChart
                    data={videoStats.formScoreData.map((d, i) => ({
                      index: i,
                      value: d.score,
                      label: ''
                    }))}
                    color="rgb(34, 197, 94)"
                    maxValue={100}
                    height={240}
                  />
                </div>
              )}
              
              {/* Reps Chart */}
              {videoStats.repsData.length > 0 && (
                <div>
                  <h4 className="text-cyan-400 text-sm mb-4 font-medium">Reps Per Workout</h4>
                  <LineChart
                    data={videoStats.repsData.map((d, i) => ({
                      index: i,
                      value: d.reps,
                      label: ''
                    }))}
                    color="rgb(59, 130, 246)"
                    height={240}
                  />
                </div>
              )}
              
              {videoStats.formScoreData.length === 0 && videoStats.repsData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No data available for charts
                </div>
              )}
            </Card>
          )}
          
          {videoWorkoutsByExercise.size === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Video className="mx-auto text-gray-500 mb-4" size={48} />
                <p className="text-gray-400 text-lg">No video workouts yet</p>
                <p className="text-gray-500 text-sm mt-1">
                  Complete a workout with video recording to see it here
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {Array.from(videoWorkoutsByExercise.entries()).map(([exerciseName, exerciseWorkouts]) => (
                <div key={exerciseName} className="bg-dark-800 rounded-lg">
                  <button
                    onClick={() => toggleExercise(exerciseName)}
                    className="w-full flex items-center justify-between p-4 hover:bg-dark-700 transition-colors rounded-lg"
                  >
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Video className="w-5 h-5 text-cyan-400" />
                      {exerciseName}
                      <span className="text-sm text-gray-400 font-normal">
                        ({exerciseWorkouts.length})
                      </span>
                    </h3>
                    {expandedExercises.has(exerciseName) ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  
                  {expandedExercises.has(exerciseName) && (
                    <div className="px-4 pb-4 space-y-3">
                      {exerciseWorkouts.map((workout) => (
                        <Card key={workout.id}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                                <span className="flex items-center gap-1">
                                  <Calendar size={14} />
                                  {formatDate(workout.createdAt)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock size={14} />
                                  {formatTime(workout.createdAt)}
                                </span>
                                {workout.durationMs > 0 && (
                                  <span>{formatDuration(workout.durationMs)}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-6">
                              <button
                                onClick={() => handlePlayVideo(workout.videoUrl!, exerciseName)}
                                className="flex items-center gap-1 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/50"
                              >
                                <Play size={16} />
                                <span className="text-sm">Play</span>
                              </button>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-cyan-400">
                                  {workout.repCount}
                                </p>
                                <p className="text-xs text-gray-400">reps</p>
                              </div>
                              {workout.formScore !== null && (
                                <div className="text-right">
                                  <p className="text-lg font-semibold text-white">
                                    {workout.formScore}
                                  </p>
                                  <p className="text-xs text-gray-400">form</p>
                                </div>
                              )}
                              <button
                                onClick={() => deleteWorkout(workout.id)}
                                className="text-gray-500 hover:text-red-400 transition-colors p-2"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Video Modal */}
      <Modal
        isOpen={!!selectedVideoUrl || isLoadingVideo}
        onClose={handleCloseVideo}
        title={`${selectedWorkoutName} - Replay`}
      >
        {isLoadingVideo ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-400">Loading video...</span>
          </div>
        ) : selectedVideoUrl ? (
          <div className="space-y-4">
            <video
              src={selectedVideoUrl}
              controls
              autoPlay
              className="w-full aspect-video rounded-lg bg-black"
            />
            <div className="flex justify-end">
              <button
                onClick={handleCloseVideo}
                className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
