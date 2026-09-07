'use client'

import Link from 'next/link'
import {
  useParams,
  useRouter,
} from 'next/navigation'
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  addProjectDependency,
  addTaskDependency,
  createTask,
  deleteProject,
  deleteTask,
  getProject,
  getProjects,
  getProjectTasks,
  getTask,
  removeProjectDependency,
  removeTaskDependency,
  updateProject,
  updateTask,
} from '@/lib/api'

import type {
  Project,
  ProjectDetail,
} from '@/types/project'

import type {
  Task,
  TaskDetail,
  TaskFilter,
  TaskStatus,
} from '@/types/task'

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const projectId = params.id

  // =========================================================
  // PROJECT STATE
  // =========================================================

  const [project, setProject] =
    useState<ProjectDetail | null>(null)

  const [allProjects, setAllProjects] =
    useState<Project[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  // =========================================================
  // PROJECT EDIT STATE
  // =========================================================

  const [editingProject, setEditingProject] =
    useState(false)

  const [projectName, setProjectName] =
    useState('')

  const [
    projectStartDate,
    setProjectStartDate,
  ] = useState('')

  const [
    projectEndDate,
    setProjectEndDate,
  ] = useState('')

  const [projectSaving, setProjectSaving] =
    useState(false)

  const [
    projectActionError,
    setProjectActionError,
  ] = useState<string | null>(null)

  // =========================================================
  // TASK STATE
  // =========================================================

  const [tasks, setTasks] =
    useState<Task[]>([])

  const [allTaskTree, setAllTaskTree] =
    useState<Task[]>([])

  const parentTaskOptions = useMemo(
    () => flattenTasks(allTaskTree),
    [allTaskTree]
  )

  // =========================================================
  // CREATE TASK STATE
  // =========================================================

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

  // =========================================================
  // PROJECT DEPENDENCY STATE
  // =========================================================

  const [
    selectedProjectDependencyId,
    setSelectedProjectDependencyId,
  ] = useState('')

  const [
    projectDependencyLoading,
    setProjectDependencyLoading,
  ] = useState(false)

  const [
    projectDependencyError,
    setProjectDependencyError,
  ] = useState<string | null>(null)

  // =========================================================
  // TASK FILTER STATE
  // =========================================================

  const [taskSearch, setTaskSearch] =
    useState('')

  const [
    taskStatusFilter,
    setTaskStatusFilter,
  ] = useState<TaskStatus | ''>('')

  const [
    appliedTaskFilter,
    setAppliedTaskFilter,
  ] = useState<TaskFilter>({})

  const [
    taskFilterLoading,
    setTaskFilterLoading,
  ] = useState(false)

  // =========================================================
  // LOAD DATA
  // =========================================================

  async function loadProject() {
    try {
      setLoading(true)
      setError(null)

      const [
        projectData,
        taskData,
        fullTaskData,
        projectsData,
      ] = await Promise.all([
        getProject(projectId),

        getProjectTasks(
          projectId,
          appliedTaskFilter
        ),

        getProjectTasks(projectId),

        getProjects(),
      ])

      setProject(projectData)
      setTasks(taskData)
      setAllTaskTree(fullTaskData)
      setAllProjects(projectsData)
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

  useEffect(() => {
    void loadProject()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  // =========================================================
  // PROJECT EDIT
  // =========================================================

  function handleStartProjectEdit() {
    if (!project) return

    setProjectName(project.name)

    setProjectStartDate(
      project.startDate.slice(0, 10)
    )

    setProjectEndDate(
      project.endDate.slice(0, 10)
    )

    setProjectActionError(null)
    setEditingProject(true)
  }

  function handleCancelProjectEdit() {
    setEditingProject(false)
    setProjectActionError(null)
  }

  async function handleSaveProject() {
    if (!project) return

    const confirmed = confirmAction(
      `Save changes to project "${project.name}"?`
    )

    if (!confirmed) {
      return
    }

    try {
      setProjectSaving(true)
      setProjectActionError(null)

      await updateProject(
        project.id,
        {
          name: projectName,
          startDate: projectStartDate,
          endDate: projectEndDate,
        }
      )

      setEditingProject(false)

      await loadProject()
    } catch (error) {
      setProjectActionError(
        error instanceof Error
          ? error.message
          : 'Failed to update project'
      )
    } finally {
      setProjectSaving(false)
    }
  }

  async function handleDeleteProject() {
    if (!project) return

    const confirmed = confirmAction(
      `Delete project "${project.name}"?\n\n` +
      `All tasks and dependency relationships belonging to this project will also be deleted.`
    )

    if (!confirmed) {
      return
    }

    try {
      setProjectSaving(true)
      setProjectActionError(null)

      await deleteProject(project.id)

      router.push('/projects')
      router.refresh()
    } catch (error) {
      setProjectActionError(
        error instanceof Error
          ? error.message
          : 'Failed to delete project'
      )
    } finally {
      setProjectSaving(false)
    }
  }

  // =========================================================
  // CREATE TASK
  // =========================================================

  async function handleCreateTask(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    const confirmed = confirmAction(
      `Create task "${taskName}"?`
    )

    if (!confirmed) {
      return
    }

    try {
      setTaskSubmitting(true)
      setError(null)

      await createTask(
        projectId,
        {
          name: taskName,
          weight: taskWeight,
          status: taskStatus,
          parentTaskId:
            parentTaskId || null,
        }
      )

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

  // =========================================================
  // PROJECT DEPENDENCY
  // =========================================================

  async function handleAddProjectDependency() {
    if (
      !selectedProjectDependencyId ||
      !project
    ) {
      return
    }

    const dependencyProject =
      allProjects.find(
        (item) =>
          item.id ===
          selectedProjectDependencyId
      )

    const confirmed = confirmAction(
      `Add "${dependencyProject?.name ?? 'this project'}" ` +
      `as a dependency of "${project.name}"?`
    )

    if (!confirmed) {
      return
    }

    try {
      setProjectDependencyLoading(true)
      setProjectDependencyError(null)

      await addProjectDependency(
        projectId,
        selectedProjectDependencyId
      )

      setSelectedProjectDependencyId('')

      await loadProject()
    } catch (error) {
      setProjectDependencyError(
        error instanceof Error
          ? error.message
          : 'Failed to add project dependency'
      )
    } finally {
      setProjectDependencyLoading(false)
    }
  }

  async function handleRemoveProjectDependency(
    dependsOnProjectId: string
  ) {
    const dependencyProject =
      allProjects.find(
        (item) =>
          item.id === dependsOnProjectId
      )

    const confirmed = confirmAction(
      `Remove project dependency "${dependencyProject?.name ?? 'this project'}"?`
    )

    if (!confirmed) {
      return
    }

    try {
      setProjectDependencyLoading(true)
      setProjectDependencyError(null)

      await removeProjectDependency(
        projectId,
        dependsOnProjectId
      )

      await loadProject()
    } catch (error) {
      setProjectDependencyError(
        error instanceof Error
          ? error.message
          : 'Failed to remove project dependency'
      )
    } finally {
      setProjectDependencyLoading(false)
    }
  }

  // =========================================================
  // TASK FILTER
  // =========================================================

  async function handleApplyTaskFilter() {
    const filter: TaskFilter = {
      search:
        taskSearch.trim() || undefined,

      status:
        taskStatusFilter || undefined,
    }

    try {
      setTaskFilterLoading(true)
      setError(null)

      const filteredTasks =
        await getProjectTasks(
          projectId,
          filter
        )

      setAppliedTaskFilter(filter)
      setTasks(filteredTasks)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to filter tasks'
      )
    } finally {
      setTaskFilterLoading(false)
    }
  }

  async function handleClearTaskFilter() {
    try {
      setTaskFilterLoading(true)
      setError(null)

      setTaskSearch('')
      setTaskStatusFilter('')

      const emptyFilter: TaskFilter = {}

      const allTasks =
        await getProjectTasks(
          projectId,
          emptyFilter
        )

      setAppliedTaskFilter(emptyFilter)
      setTasks(allTasks)
      setAllTaskTree(allTasks)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to clear task filter'
      )
    } finally {
      setTaskFilterLoading(false)
    }
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl p-8">
        Loading project...
      </main>
    )
  }

  // =========================================================
  // ERROR
  // =========================================================

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

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="mx-auto max-w-6xl p-8">
      <Link
        href="/projects"
        className="text-sm text-gray-600 hover:text-black"
      >
        ← Back to projects
      </Link>

      {/* =====================================================
          PROJECT INFORMATION
      ====================================================== */}

      <section className="mt-6 rounded-xl border p-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
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

          <div className="flex flex-col items-start gap-4 md:items-end">
            <div className="text-left md:text-right">
              <div className="font-medium">
                {project.status}
              </div>

              <div className="text-sm text-gray-600">
                {project.progress}%
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleStartProjectEdit}
                disabled={projectSaving}
                className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
              >
                Edit Project
              </button>

              <button
                type="button"
                onClick={handleDeleteProject}
                disabled={projectSaving}
                className="rounded-md border border-red-200 px-4 py-2 text-sm text-red-600 disabled:opacity-50"
              >
                {projectSaving
                  ? 'Processing...'
                  : 'Delete Project'}
              </button>
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

        {projectActionError && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {projectActionError}
          </div>
        )}

        {/* PROJECT EDIT FORM */}

        {editingProject && (
          <div className="mt-6 border-t pt-5">
            <h2 className="mb-4 text-lg font-semibold">
              Edit Project
            </h2>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Project Name
                </label>

                <input
                  value={projectName}
                  onChange={(event) =>
                    setProjectName(
                      event.target.value
                    )
                  }
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Start Date
                </label>

                <input
                  type="date"
                  value={projectStartDate}
                  onChange={(event) =>
                    setProjectStartDate(
                      event.target.value
                    )
                  }
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  End Date
                </label>

                <input
                  type="date"
                  value={projectEndDate}
                  onChange={(event) =>
                    setProjectEndDate(
                      event.target.value
                    )
                  }
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleSaveProject}
                disabled={projectSaving}
                className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {projectSaving
                  ? 'Saving...'
                  : 'Save Changes'}
              </button>

              <button
                type="button"
                onClick={
                  handleCancelProjectEdit
                }
                disabled={projectSaving}
                className="rounded-md border px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* =====================================================
          PROJECT DEPENDENCIES
      ====================================================== */}

      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">
            Project Dependencies
          </h2>

          <p className="mt-1 text-sm text-gray-600">
            This project can only progress when
            all dependency projects are Done.
          </p>
        </div>

        <div className="rounded-xl border p-5">
          {project.dependencies.length > 0 ? (
            <div className="mb-5 space-y-2">
              {project.dependencies.map(
                (dependency) => {
                  const dependencyProject =
                    allProjects.find(
                      (item) =>
                        item.id ===
                        dependency.dependsOnProjectId
                    )

                  return (
                    <div
                      key={
                        dependency.dependsOnProjectId
                      }
                      className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
                    >
                      <div>
                        <div className="font-medium">
                          {dependencyProject?.name ??
                            dependency
                              .dependsOnProject
                              .name}
                        </div>

                        <div className="mt-1 text-sm text-gray-500">
                          Status:{' '}
                          {dependencyProject?.status ??
                            'Unknown'}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveProjectDependency(
                            dependency.dependsOnProjectId
                          )
                        }
                        disabled={
                          projectDependencyLoading
                        }
                        className="text-sm text-red-600 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  )
                }
              )}
            </div>
          ) : (
            <div className="mb-5 text-sm text-gray-500">
              No project dependencies.
            </div>
          )}

          <div className="flex gap-2">
            <select
              value={
                selectedProjectDependencyId
              }
              onChange={(event) =>
                setSelectedProjectDependencyId(
                  event.target.value
                )
              }
              className="flex-1 rounded-md border px-3 py-2"
            >
              <option value="">
                Select project dependency
              </option>

              {allProjects
                .filter(
                  (candidate) =>
                    candidate.id !== project.id &&
                    !project.dependencies.some(
                      (dependency) =>
                        dependency.dependsOnProjectId ===
                        candidate.id
                    )
                )
                .map((candidate) => (
                  <option
                    key={candidate.id}
                    value={candidate.id}
                  >
                    {candidate.name}
                    {' - '}
                    {candidate.status}
                  </option>
                ))}
            </select>

            <button
              type="button"
              onClick={
                handleAddProjectDependency
              }
              disabled={
                !selectedProjectDependencyId ||
                projectDependencyLoading
              }
              className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {projectDependencyLoading
                ? 'Processing...'
                : 'Add'}
            </button>
          </div>

          {projectDependencyError && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {projectDependencyError}
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          TASKS
      ====================================================== */}

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
            type="button"
            onClick={() =>
              setShowTaskForm(
                (value) => !value
              )
            }
            className="rounded-md bg-black px-4 py-2 text-sm text-white"
          >
            {showTaskForm
              ? 'Cancel'
              : 'Add Task'}
          </button>
        </div>

        {/* TASK FILTER */}

        <div className="mb-6 grid gap-3 rounded-xl border p-4 md:grid-cols-[1fr_220px_auto]">
          <input
            type="search"
            value={taskSearch}
            onChange={(event) =>
              setTaskSearch(
                event.target.value
              )
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void handleApplyTaskFilter()
              }
            }}
            placeholder="Search tasks..."
            className="rounded-md border px-3 py-2"
          />

          <select
            value={taskStatusFilter}
            onChange={(event) =>
              setTaskStatusFilter(
                event.target.value as
                  | TaskStatus
                  | ''
              )
            }
            className="rounded-md border px-3 py-2"
          >
            <option value="">
              All statuses
            </option>

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

          <div className="flex gap-2">
            <button
              type="button"
              onClick={
                handleApplyTaskFilter
              }
              disabled={taskFilterLoading}
              className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {taskFilterLoading
                ? 'Loading...'
                : 'Apply'}
            </button>

            <button
              type="button"
              onClick={
                handleClearTaskFilter
              }
              disabled={taskFilterLoading}
              className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>

        {/* CREATE TASK */}

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
                  setTaskName(
                    event.target.value
                  )
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
                    Number(
                      event.target.value
                    )
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
                    event.target
                      .value as TaskStatus
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
                  setParentTaskId(
                    event.target.value
                  )
                }
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="">
                  No parent
                </option>

                {parentTaskOptions.map(
                  (task) => (
                    <option
                      key={task.id}
                      value={task.id}
                    >
                      {task.label}
                    </option>
                  )
                )}
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

        {/* TASK TREE */}

        {tasks.length === 0 ? (
          <div className="rounded-xl border p-8 text-center text-gray-500">
            {appliedTaskFilter.search ||
            appliedTaskFilter.status
              ? 'No tasks match the current filter.'
              : 'No tasks yet.'}
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                allTasks={
                  parentTaskOptions
                }
                onUpdated={loadProject}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

// ===========================================================
// TASK ITEM
// ===========================================================

function TaskItem({
  task,
  level = 0,
  allTasks,
  onUpdated,
}: {
  task: Task
  level?: number
  allTasks: TaskOption[]
  onUpdated: () => Promise<void>
}) {
  const [editing, setEditing] =
    useState(false)

  const [name, setName] =
    useState(task.name)

  const [weight, setWeight] =
    useState(task.weight)

  const [status, setStatus] =
    useState<TaskStatus>(task.status)

  const [
    parentTaskId,
    setParentTaskId,
  ] = useState(
    task.parentTaskId ?? ''
  )

  const [saving, setSaving] =
    useState(false)

  const [deleting, setDeleting] =
    useState(false)

  const [taskError, setTaskError] =
    useState<string | null>(null)

  // =========================================================
  // TASK DEPENDENCY STATE
  // =========================================================

  const [taskDetail, setTaskDetail] =
    useState<TaskDetail | null>(null)

  const [
    showDependencies,
    setShowDependencies,
  ] = useState(false)

  const [
    selectedDependencyId,
    setSelectedDependencyId,
  ] = useState('')

  const [
    dependencyLoading,
    setDependencyLoading,
  ] = useState(false)

  const [
    dependencyError,
    setDependencyError,
  ] = useState<string | null>(null)

  // =========================================================
  // EDIT TASK
  // =========================================================

  function handleStartEdit() {
    setName(task.name)
    setWeight(task.weight)
    setStatus(task.status)

    setParentTaskId(
      task.parentTaskId ?? ''
    )

    setTaskError(null)
    setEditing(true)
  }

  async function handleSave() {
    const confirmed = confirmAction(
      `Save changes to task "${task.name}"?`
    )

    if (!confirmed) {
      return
    }

    try {
      setSaving(true)
      setTaskError(null)

      await updateTask(
        task.id,
        {
          name,
          weight,
          status,
          parentTaskId:
            parentTaskId || null,
        }
      )

      setEditing(false)

      await onUpdated()
    } catch (error) {
      setTaskError(
        error instanceof Error
          ? error.message
          : 'Failed to update task'
      )
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setName(task.name)
    setWeight(task.weight)
    setStatus(task.status)

    setParentTaskId(
      task.parentTaskId ?? ''
    )

    setTaskError(null)
    setEditing(false)
  }

  // =========================================================
  // DELETE TASK
  // =========================================================

  async function handleDeleteTask() {
    const confirmed = confirmAction(
      `Delete task "${task.name}"?\n\n` +
      `Its child tasks will become root tasks. ` +
      `Dependency relationships involving this task will also be removed.`
    )

    if (!confirmed) {
      return
    }

    try {
      setDeleting(true)
      setTaskError(null)

      await deleteTask(task.id)

      await onUpdated()
    } catch (error) {
      setTaskError(
        error instanceof Error
          ? error.message
          : 'Failed to delete task'
      )
    } finally {
      setDeleting(false)
    }
  }

  // =========================================================
  // TASK DEPENDENCY
  // =========================================================

  async function loadTaskDetail() {
    try {
      setDependencyLoading(true)
      setDependencyError(null)

      const detail =
        await getTask(task.id)

      setTaskDetail(detail)
    } catch (error) {
      setDependencyError(
        error instanceof Error
          ? error.message
          : 'Failed to load dependencies'
      )
    } finally {
      setDependencyLoading(false)
    }
  }

  async function handleToggleDependencies() {
    const nextValue =
      !showDependencies

    setShowDependencies(nextValue)

    if (
      nextValue &&
      !taskDetail
    ) {
      await loadTaskDetail()
    }
  }

  async function handleAddDependency() {
    if (!selectedDependencyId) {
      return
    }

    const dependencyTask =
      allTasks.find(
        (item) =>
          item.id ===
          selectedDependencyId
      )

    const confirmed = confirmAction(
      `Add "${dependencyTask?.name ?? 'this task'}" ` +
      `as a dependency of "${task.name}"?`
    )

    if (!confirmed) {
      return
    }

    try {
      setDependencyLoading(true)
      setDependencyError(null)

      await addTaskDependency(
        task.id,
        selectedDependencyId
      )

      setSelectedDependencyId('')

      await loadTaskDetail()
      await onUpdated()
    } catch (error) {
      setDependencyError(
        error instanceof Error
          ? error.message
          : 'Failed to add dependency'
      )
    } finally {
      setDependencyLoading(false)
    }
  }

  async function handleRemoveDependency(
    dependsOnTaskId: string
  ) {
    const dependencyTask =
      allTasks.find(
        (item) =>
          item.id ===
          dependsOnTaskId
      )

    const confirmed = confirmAction(
      `Remove dependency "${dependencyTask?.name ?? 'this task'}" ` +
      `from "${task.name}"?`
    )

    if (!confirmed) {
      return
    }

    try {
      setDependencyLoading(true)
      setDependencyError(null)

      await removeTaskDependency(
        task.id,
        dependsOnTaskId
      )

      await loadTaskDetail()
      await onUpdated()
    } catch (error) {
      setDependencyError(
        error instanceof Error
          ? error.message
          : 'Failed to remove dependency'
      )
    } finally {
      setDependencyLoading(false)
    }
  }

  // =========================================================
  // RENDER TASK
  // =========================================================

  return (
    <div>
      <div
        className="rounded-lg border p-4"
        style={{
          marginLeft:
            `${level * 24}px`,
        }}
      >
        {editing ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Name
                </label>

                <input
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
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
                  value={weight}
                  onChange={(event) =>
                    setWeight(
                      Number(
                        event.target.value
                      )
                    )
                  }
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Status
                </label>

                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target
                        .value as TaskStatus
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
                    setParentTaskId(
                      event.target.value
                    )
                  }
                  className="w-full rounded-md border px-3 py-2"
                >
                  <option value="">
                    No parent
                  </option>

                  {allTasks
                    .filter(
                      (option) =>
                        option.id !==
                        task.id
                    )
                    .map((option) => (
                      <option
                        key={option.id}
                        value={option.id}
                      >
                        {option.label}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {saving
                  ? 'Saving...'
                  : 'Save'}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="rounded-md border px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="font-medium">
                {task.name}
              </div>

              <div className="mt-1 text-sm text-gray-500">
                Weight: {task.weight}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-2 text-sm font-medium">
                {task.status}
              </span>

              <button
                type="button"
                onClick={
                  handleToggleDependencies
                }
                className="rounded-md border px-3 py-1.5 text-sm"
              >
                Dependencies
              </button>

              <button
                type="button"
                onClick={handleStartEdit}
                className="rounded-md border px-3 py-1.5 text-sm"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={handleDeleteTask}
                disabled={deleting}
                className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 disabled:opacity-50"
              >
                {deleting
                  ? 'Deleting...'
                  : 'Delete'}
              </button>
            </div>
          </div>
        )}

        {taskError && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {taskError}
          </div>
        )}

        {/* TASK DEPENDENCIES */}

        {showDependencies && (
          <div className="mt-4 border-t pt-4">
            <div className="mb-3 text-sm font-medium">
              Dependencies
            </div>

            {dependencyLoading &&
            !taskDetail ? (
              <div className="text-sm text-gray-500">
                Loading dependencies...
              </div>
            ) : (
              <>
                {taskDetail?.dependencies
                  .length ? (
                  <div className="mb-4 space-y-2">
                    {taskDetail.dependencies.map(
                      (dependency) => {
                        const dependencyTask =
                          allTasks.find(
                            (option) =>
                              option.id ===
                              dependency
                                .dependsOnTaskId
                          )

                        return (
                          <div
                            key={
                              dependency.dependsOnTaskId
                            }
                            className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2"
                          >
                            <span className="text-sm">
                              {dependencyTask?.name ??
                                dependency.dependsOnTaskId}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveDependency(
                                  dependency.dependsOnTaskId
                                )
                              }
                              disabled={
                                dependencyLoading
                              }
                              className="text-sm text-red-600 disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </div>
                        )
                      }
                    )}
                  </div>
                ) : (
                  <div className="mb-4 text-sm text-gray-500">
                    No dependencies.
                  </div>
                )}

                <div className="flex gap-2">
                  <select
                    value={
                      selectedDependencyId
                    }
                    onChange={(event) =>
                      setSelectedDependencyId(
                        event.target.value
                      )
                    }
                    className="flex-1 rounded-md border px-3 py-2 text-sm"
                  >
                    <option value="">
                      Select dependency
                    </option>

                    {allTasks
                      .filter(
                        (option) =>
                          option.id !==
                            task.id &&
                          !taskDetail?.dependencies.some(
                            (dependency) =>
                              dependency.dependsOnTaskId ===
                              option.id
                          )
                      )
                      .map((option) => (
                        <option
                          key={option.id}
                          value={option.id}
                        >
                          {option.label}
                        </option>
                      ))}
                  </select>

                  <button
                    type="button"
                    onClick={
                      handleAddDependency
                    }
                    disabled={
                      !selectedDependencyId ||
                      dependencyLoading
                    }
                    className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>

                {dependencyError && (
                  <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {dependencyError}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* RECURSIVE SUBTASKS */}

      {task.subtasks.map(
        (subtask) => (
          <TaskItem
            key={subtask.id}
            task={subtask}
            level={level + 1}
            allTasks={allTasks}
            onUpdated={onUpdated}
          />
        )
      )}
    </div>
  )
}

// ===========================================================
// TASK OPTIONS
// ===========================================================

type TaskOption = {
  id: string
  label: string
  name: string
}

function flattenTasks(
  tasks: Task[],
  level = 0
): TaskOption[] {
  return tasks.flatMap(
    (task) => [
      {
        id: task.id,
        name: task.name,
        label:
          `${'— '.repeat(level)}${task.name}`,
      },

      ...flattenTasks(
        task.subtasks,
        level + 1
      ),
    ]
  )
}

// ===========================================================
// CONFIRMATION
// ===========================================================

function confirmAction(
  message: string
): boolean {
  return window.confirm(message)
}