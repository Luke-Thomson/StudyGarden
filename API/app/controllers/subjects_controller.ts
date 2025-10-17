import type { HttpContext } from '@adonisjs/core/http'
import SubjectPolicy from '#policies/subject_policy'
import SubjectService from '#services/subject_service'
import { subjectStoreValidator } from '#validators/subject_store'
import { subjectUpdateValidator } from '#validators/subject_update'

export default class SubjectsController {
  private service = new SubjectService()

  // GET /subjects
  public async index({ auth }: HttpContext) {
    const user = auth.user!
    return this.service.listForUser({ id: user.id, role: user.role })
  }

  // POST /subjects
  public async store({ auth, request, bouncer, response }: HttpContext) {
    await bouncer.with(SubjectPolicy).authorize('create')
    const payload = await request.validateUsing(subjectStoreValidator)
    const subject = await this.service.createForUser(auth.user!.id, payload)
    return response.created(subject)
  }

  // GET /subjects/:id
  public async show({ params, bouncer }: HttpContext) {
    const subject = await this.service.get(Number(params.id))
    await bouncer.with(SubjectPolicy).authorize('view', subject)
    return subject
  }

  // PATCH /subjects/:id
  public async update({ params, request, bouncer }: HttpContext) {
    const subject = await this.service.get(Number(params.id))
    await bouncer.with(SubjectPolicy).authorize('edit', subject)
    const data = await request.validateUsing(subjectUpdateValidator)
    return this.service.update(subject.id, data)
  }

  // DELETE /subjects/:id
  public async destroy({ params, bouncer, response }: HttpContext) {
    const subject = await this.service.get(Number(params.id))
    await bouncer.with(SubjectPolicy).authorize('delete', subject)
    await this.service.destroy(subject.id)
    return response.noContent()
  }

  // GET /me/subjects
  public async mine({ auth }: HttpContext) {
    return this.service.listMine(auth.user!.id)
  }

  // GET /users/:id/subjects (admin-only route group)
  public async byUser({ params }: HttpContext) {
    return this.service.listByUserId(Number(params.id))
  }
}
