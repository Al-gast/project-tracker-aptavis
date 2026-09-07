'use client'

import { FormEvent, useEffect, useState } from 'react'

import {
  createProject,
  getProjects,
} from '@/lib/api'

import type { Project } from '@/types/project'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  async function loadProjects() {
    try {
      setLoading(true)
      setError(null)

      const data = await getProjects()

      setProjects(data)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to load projects'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    try {
      setSubmitting(true)
      setError(null)

      await createProject({
        name,
        startDate,
        endDate,
      })

      setName('')
      setStartDate('')
      setEndDate('')

      await loadProjects()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to create project'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">
          Project Tracker
        </h1>

        <p className="mt-2 text-gray-600">
          Manage projects, tasks, schedules, and dependencies.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mb-10 grid gap-4 rounded-xl border p-6 md:grid-cols-4"
      >
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Project name"
          required
          className="rounded-md border px-3 py-2"
        />

        <input
          type="date"
          value={startDate}
          onChange={(event) =>
            setStartDate(event.target.value)
          }
          required
          className="rounded-md border px-3 py-2"
        />

        <input
          type="date"
          value={endDate}
          onChange={(event) =>
            setEndDate(event.target.value)
          }
          required
          className="rounded-md border px-3 py-2"
        />

        <button
          disabled={submitting}
          className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create Project'}
        </button>
      </form>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading projects...</p>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-xl border p-5"
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h2 className="text-lg font-semibold">
                    {project.name}
                  </h2>

                  <p className="mt-1 text-sm text-gray-600">
                    {project.startDate.slice(0, 10)}
                    {' - '}
                    {project.endDate.slice(0, 10)}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-sm font-medium">
                    {project.status}
                  </div>

                  <div className="text-sm text-gray-600">
                    {project.progress}%
                  </div>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded bg-gray-200">
                <div
                  className="h-full bg-black"
                  style={{
                    width: `${project.progress}%`,
                  }}
                />
              </div>
            </div>
          ))}

          {projects.length === 0 && (
            <p className="text-gray-500">
              No projects yet.
            </p>
          )}
        </div>
      )}
    </main>
  )
}