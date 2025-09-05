import type { HttpContext } from '@adonisjs/core/http'
import Subject from "#models/subject";

export default class SubjectsController {
  // GET /subjects
  async index({}: HttpContext) {
    const subjects = await Subject.all()
    return subjects.map((s) => ({ id: s.id, title: s.title }))
  }

  // GET /subjects/:id
  async show({ params, response }: HttpContext) {
    const subject = await Subject.find(params.id)
    if (!subject) {
      return response.notFound({ message: 'Subject not found' })
    }
    return { id: subject.id, title: subject.title }
  }

  // POST /subjects
  async store({ auth, request, response }: HttpContext) {
    const { title } = request.only(['title'])
    if (!title) return response.badRequest({ message: 'title required' })

    const subject = await Subject.create({
      title,
      userId: auth.user!.id,
    })

    return response.created({ id: subject.id, title: subject.title })
  }

  // PUT /subjects/:id
  async update({ params, request, response }: HttpContext) {
    const subject = await Subject.find(params.id)
    if (!subject) {
      return response.notFound({ message: 'Subject not found' })
    }

    const { title } = request.only(['title'])
    if (title) subject.title = title

    await subject.save()
    return { id: subject.id, title: subject.title }
  }

  // DELETE /subjects/:id
  async destroy({ params, response }: HttpContext) {
    const subject = await Subject.find(params.id)
    if (!subject) {
      return response.notFound({ message: 'Subject not found' })
    }

    await subject.delete()
    return response.noContent()
  }
}
