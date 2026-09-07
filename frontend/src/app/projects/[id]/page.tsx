'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  getProject,
  getProjectTasks,
  createTask,
} from '@/lib/api'

import type { ProjectDetail } from '@/types/project'
import type { Task, TaskStatus } from '@/types/task'

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>()

  const projectId = params.id

  const [project, setProject] =
    useState<ProjectDetail | null>(null)

  const [tasks, setTasks] =
    useState<Task[]>([])

  const [loading, setLoading] = useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const [showTaskForm, setShowTaskForm] =
    useState(false)

  const [taskName, setTaskName] =
    useState('')

  const [taskWeight, setTaskWeight] =
    useState(1)

  const [taskStatus, setTaskStatus] =
    useState<TaskStatus>('DRAFT')

  const [parentTaskId, setParentTaskId] =
    useState('')

  const [taskSubmitting, setTaskSubmitting] =
    useState(false)

const parentTaskOptions = useMemo(
  () => flattenTasks(tasks),
  [tasks]
)

  useEffect(() => {
    loadProject()
  }, [projectId])

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl p-8">
        Loading project...
      </main>
    )
  }

  if (error || !project) {
    return (
      <main className="mx-auto max-w-6xl p-8">
        <Link
          href="/projects"
          className="text-sm underline"
        >
          Back to projects
        </Link>

        <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          {error ?? 'Project not found'}
        </div>
      </main>
    )
  }

  async function loadProject() {
    try {
      setLoading(true)
      setError(null)

      const [projectData, taskData] =
        await Promise.all([
          getProject(projectId),
          getProjectTasks(projectId),
        ])

      setProject(projectData)
      setTasks(taskData)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to load project'
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateTask(
  event: FormEvent<HTMLFormElement>
) {
  event.preventDefault()

  try {
    setTaskSubmitting(true)
    setError(null)

    await createTask(projectId, {
      name: taskName,
      weight: taskWeight,
      status: taskStatus,
      parentTaskId:
        parentTaskId || null,
    })

    setTaskName('')
    setTaskWeight(1)
    setTaskStatus('DRAFT')
    setParentTaskId('')
    setShowTaskForm(false)

    await loadProject()
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : 'Failed to create task'
    )
  } finally {
    setTaskSubmitting(false)
  }
    }

  return (
    <main className="mx-auto max-w-6xl p-8">
      <Link
        href="/projects"
        className="text-sm text-gray-600 hover:text-black"
      >
        ← Back to projects
      </Link>

      <section className="mt-6 rounded-xl border p-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold">
              {project.name}
            </h1>

            <p className="mt-2 text-gray-600">
              {project.startDate.slice(0, 10)}
              {' - '}
              {project.endDate.slice(0, 10)}
            </p>
          </div>

          <div className="text-right">
            <div className="font-medium">
              {project.status}
            </div>

            <div className="text-sm text-gray-600">
              {project.progress}%
            </div>
          </div>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded bg-gray-200">
          <div
            className="h-full bg-black"
            style={{
              width: `${project.progress}%`,
            }}
          />
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Tasks
            </h2>

            <p className="text-sm text-gray-600">
              Tasks and subtasks in this project.
            </p>
          </div>

          <button
            onClick={() =>
                setShowTaskForm((value) => !value)
            }
            className="rounded-md bg-black px-4 py-2 text-sm text-white"
            >
            {showTaskForm ? 'Cancel' : 'Add Task'}
          </button>
        </div>

        {showTaskForm && (
            <form
                onSubmit={handleCreateTask}
                className="mb-6 grid gap-4 rounded-xl border p-5 md:grid-cols-2"
            >
                <div>
                <label className="mb-1 block text-sm font-medium">
                    Task Name
                </label>

                <input
                    value={taskName}
                    onChange={(event) =>
                    setTaskName(event.target.value)
                    }
                    required
                    placeholder="Example: Backend API"
                    className="w-full rounded-md border px-3 py-2"
                />
                </div>

                <div>
                <label className="mb-1 block text-sm font-medium">
                    Weight
                </label>

                <input
                    type="number"
                    min={1}
                    value={taskWeight}
                    onChange={(event) =>
                    setTaskWeight(
                        Number(event.target.value)
                    )
                    }
                    required
                    className="w-full rounded-md border px-3 py-2"
                />
                </div>

                <div>
                <label className="mb-1 block text-sm font-medium">
                    Status
                </label>

                <select
                    value={taskStatus}
                    onChange={(event) =>
                    setTaskStatus(
                        event.target.value as TaskStatus
                    )
                    }
                    className="w-full rounded-md border px-3 py-2"
                >
                    <option value="DRAFT">
                    Draft
                    </option>

                    <option value="IN_PROGRESS">
                    In Progress
                    </option>

                    <option value="DONE">
                    Done
                    </option>
                </select>
                </div>

                <div>
                <label className="mb-1 block text-sm font-medium">
                    Parent Task
                </label>

                <select
                    value={parentTaskId}
                    onChange={(event) =>
                    setParentTaskId(event.target.value)
                    }
                    className="w-full rounded-md border px-3 py-2"
                >
                    <option value="">
                    No parent
                    </option>

                    {parentTaskOptions.map((task) => (
                    <option
                        key={task.id}
                        value={task.id}
                    >
                        {task.label}
                    </option>
                    ))}
                </select>
                </div>

                <div className="md:col-span-2">
                <button
                    disabled={taskSubmitting}
                    className="rounded-md bg-black px-5 py-2 text-white disabled:opacity-50"
                >
                    {taskSubmitting
                    ? 'Creating...'
                    : 'Create Task'}
                </button>
                </div>
            </form>
            )}

        {tasks.length === 0 ? (
          <div className="rounded-xl border p-8 text-center text-gray-500">
            No tasks yet.
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function TaskItem({
  task,
  level = 0,
}: {
  task: Task
  level?: number
}) {
  return (
    <div>
      <div
        className="rounded-lg border p-4"
        style={{
          marginLeft: `${level * 24}px`,
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-medium">
              {task.name}
            </div>

            <div className="mt-1 text-sm text-gray-500">
              Weight: {task.weight}
            </div>
          </div>

          <span className="text-sm font-medium">
            {task.status}
          </span>
        </div>
      </div>

      {task.subtasks.map((subtask) => (
        <TaskItem
          key={subtask.id}
          task={subtask}
          level={level + 1}
        />
      ))}
    </div>
  )
}

type TaskOption = {
  id: string
  label: string
}

function flattenTasks(
  tasks: Task[],
  level = 0
): TaskOption[] {
  return tasks.flatMap((task) => [
    {
      id: task.id,
      label: `${'— '.repeat(level)}${task.name}`,
    },
    ...flattenTasks(task.subtasks, level + 1),
  ])
}