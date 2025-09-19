import type { HttpContext } from '@adonisjs/core/http'
import Subject from '#models/subject'
import SubjectPolicy from '#policies/subject_policy'

export default class SubjectsController {
  /**
   * Display a list of resource
   * GET /subjects
   */
  public async index({ auth }: HttpContext) {
    const user = auth.user!
    // admin gets all subjects
    if (user.role === 'admin') {
      return Subject.query().preload('user')
    }
    // users gets only their subjects
    return Subject.query().where('user_id', user.id)
  }


  /**
   * Handle form submission for the create action
   * POST /subjects
   */
  public async store({ auth, request, bouncer }: HttpContext) {
    await bouncer.with(SubjectPolicy).authorize('create')
    const { title } = request.only(['title'])
    return Subject.create({ title, userId: auth.user!.id }) // never accept userId from client
  }

  /**
   * Show individual record
   * GET /subjects/:id
   */
  public async show({ params, bouncer }: HttpContext) {
    const subject = await Subject.findOrFail(params.id)
    await bouncer.with(SubjectPolicy).authorize('view', subject)
    return subject
  }

  /**
   * Handle form submission for the edit action
   * PATCH /subjects/:id
   */
  public async update({ params, request, bouncer }: HttpContext) {
    const subject = await Subject.findOrFail(params.id)
    await bouncer.with(SubjectPolicy).authorize('edit', subject)
    subject.merge(request.only(['title']))
    await subject.save()
    return subject
  }

  /**
   * Delete record
   * DELETE /subjects/:id
   */
  public async destroy({ params, bouncer, response }: HttpContext) {
    const subject = await Subject.findOrFail(params.id)
    await bouncer.with(SubjectPolicy).authorize('delete', subject)
    await subject.delete()
    return response.noContent()
  }

  // GET /me/subjects
  public async mine({ auth }: HttpContext) {
    const user = auth.user!
    return Subject.query().where('user_id', user.id)
  }

  // GET /users/:id/subjects (admin-only route group)
  public async byUser({ params }: HttpContext) {
    return Subject.query().where('user_id', Number(params.id))
  }
}
