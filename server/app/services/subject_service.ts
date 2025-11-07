import Subject from '#models/subject'

export default class SubjectService {
  /**
   * List subjects for a user. Admins see all (with user preload).
   */
  async listForUser(user: { id: number; role: 'user' | 'admin' }) {
    if (user.role === 'admin') {
      return Subject.query().preload('user')
    }
    return Subject.query().where('userId', user.id)
  }

  /**
   * Create a subject for the given user.
   */
  async createForUser(userId: number, data: { title: string }) {
    return Subject.create({ title: data.title, userId })
  }

  /**
   * Update a subject (fields already validated).
   */
  async update(subjectId: number, data: { title?: string }) {
    const subject = await Subject.findOrFail(subjectId)
    subject.merge(data)
    await subject.save()
    return subject
  }

  /**
   * Delete a subject.
   */
  async destroy(subjectId: number) {
    const subject = await Subject.findOrFail(subjectId)
    await subject.delete()
  }

  /**
   * Get one subject by id.
   */
  async get(subjectId: number) {
    return Subject.findOrFail(subjectId)
  }

  /**
   * List subjects owned by a specific user (admin route).
   */
  async listByUserId(targetUserId: number) {
    return Subject.query().where('userId', targetUserId)
  }

  /**
   * Convenience: list “my” subjects.
   */
  async listMine(userId: number) {
    return Subject.query().where('userId', userId)
  }
}
