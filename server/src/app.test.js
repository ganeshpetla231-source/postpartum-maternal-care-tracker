import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from './app.js';
import mongoose from 'mongoose';
import { connectMongoTest } from './config/db.js';
import { env } from './config/env.js';
import User from './models/User.js';
import LactationConsultant from './models/LactationConsultant.js';
import DeidentifiedArchive from './models/DeidentifiedArchive.js';

let mongod;

beforeAll(async () => {
  mongod = await connectMongoTest();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Phase 1 auth API', () => {
  it('registers a new mother user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Asha Mother',
        email: 'asha@example.com',
        password: 'password123',
        phone: '+919999999999',
        role: 'mother'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('asha@example.com');
  });

  it('logs in a user and returns tokens', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'asha@example.com',
        password: 'password123'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it('returns current user when authenticated', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'asha@example.com',
        password: 'password123'
      });

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.data.accessToken}`);

    expect(meRes.statusCode).toBe(200);
    expect(meRes.body.data.email).toBe('asha@example.com');
  });

  it('completes a profile for a mother', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'asha@example.com',
        password: 'password123'
      });

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${loginRes.body.data.accessToken}`)
      .send({
        deliveryDate: '2026-05-01T00:00:00.000Z',
        deliveryType: 'normal',
        complications: ['fatigue'],
        emergencyContact: {
          name: 'Ravi',
          phone: '+919988776655'
        }
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.deliveryType).toBe('normal');
  });

  it('refreshes tokens using the refresh cookie', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'asha@example.com',
        password: 'password123'
      });

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', loginRes.headers['set-cookie'][0].split(';')[0]);

    expect(refreshRes.statusCode).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.accessToken).toBeTruthy();
  });

  it('logs the user out and clears the refresh cookie', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'asha@example.com',
        password: 'password123'
      });

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', loginRes.headers['set-cookie'][0].split(';')[0]);

    expect(logoutRes.statusCode).toBe(200);
    expect(logoutRes.body.success).toBe(true);
  });

  it('prevents unauthorized access to protected routes', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  it('prevents non-mother from completing profile route', async () => {
    const doctor = await User.create({
      name: 'Dr. Jay',
      email: 'jay@example.com',
      passwordHash: 'hash',
      role: 'doctor'
    });

    const token = (await import('jsonwebtoken')).default.sign({ sub: doctor._id, role: doctor.role }, (await import('./config/env.js')).env.jwtAccessSecret, {
      expiresIn: '15m'
    });

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ deliveryType: 'c-section' });

    expect(res.statusCode).toBe(403);
  });
});

describe('Phase 2 recovery and baby APIs', () => {
  const createMotherAccessToken = async (name, email, password) => {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      passwordHash,
      phone: `+91${Math.floor(Math.random() * 10000000000)}`,
      role: 'mother',
      isActive: true
    });

    return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtAccessSecret, {
      expiresIn: '15m'
    });
  };

  it('creates, lists, gets, updates and deletes a recovery milestone', async () => {
    const accessToken = await createMotherAccessToken('Asha Recovery', 'asha-recovery@example.com', 'password123');

    const createRes = await request(app)
      .post('/api/recovery/milestones')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Wound check',
        category: 'wound',
        targetDate: '2026-10-15T00:00:00.000Z',
        painLevel: 4,
        notes: 'Follow up after 10 days'
      });

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body.data.title).toBe('Wound check');

    const listRes = await request(app)
      .get('/api/recovery/milestones?status=pending&category=wound')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(listRes.statusCode).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);

    const milestoneId = createRes.body.data._id;

    const getRes = await request(app)
      .get(`/api/recovery/milestones/${milestoneId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.data.title).toBe('Wound check');

    const updateRes = await request(app)
      .patch(`/api/recovery/milestones/${milestoneId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'done', notes: 'Completed and reviewed' });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.data.status).toBe('done');

    const deleteRes = await request(app)
      .delete(`/api/recovery/milestones/${milestoneId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.data.isDeleted).toBe(true);
  });

  it('creates, lists, updates and deletes baby logs with ownership controls', async () => {
    const accessToken = await createMotherAccessToken('Baby Mom', 'baby-mom@example.com', 'password123');

    const babyRes = await request(app)
      .post('/api/babies')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Aarav',
        dob: '2026-09-01T00:00:00.000Z',
        gender: 'male',
        birthWeight: 3.2,
        notes: 'Healthy baby'
      });

    expect(babyRes.statusCode).toBe(201);
    const babyId = babyRes.body.data._id;

    const babyListRes = await request(app)
      .get('/api/babies')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(babyListRes.statusCode).toBe(200);
    expect(babyListRes.body.data.some((baby) => baby._id === babyId)).toBe(true);

    const logRes = await request(app)
      .post(`/api/babies/${babyId}/logs`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'sleep',
        sleep: {
          start: '2026-10-06T22:30:00.000Z',
          end: '2026-10-07T06:00:00.000Z'
        },
        notes: 'Long sleep'
      });

    expect(logRes.statusCode).toBe(201);
    const logId = logRes.body.data._id;

    const logListRes = await request(app)
      .get(`/api/babies/${babyId}/logs?type=sleep`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(logListRes.statusCode).toBe(200);
    expect(logListRes.body.data.some((entry) => entry._id === logId)).toBe(true);

    const updateRes = await request(app)
      .patch(`/api/babies/${babyId}/logs/${logId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ notes: 'Long sleep after feed' });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.data.notes).toBe('Long sleep after feed');

    const summaryRes = await request(app)
      .get(`/api/babies/${babyId}/logs/summary?date=2026-10-06T00:00:00.000Z`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(summaryRes.statusCode).toBe(200);
    expect(summaryRes.body.data.totalSleepMinutes).toBeGreaterThan(0);

    const deleteRes = await request(app)
      .delete(`/api/babies/${babyId}/logs/${logId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.data.isDeleted).toBe(true);

    const otherAccessToken = await createMotherAccessToken('Other Mom', 'other-mom@example.com', 'password123');
    const forbiddenRes = await request(app)
      .get(`/api/babies/${babyId}/logs`)
      .set('Authorization', `Bearer ${otherAccessToken}`);

    expect(forbiddenRes.statusCode).toBe(404);
  });

  it('rejects invalid sleep ranges and invalid feed payloads', async () => {
    const accessToken = await createMotherAccessToken('Sleep Mom', 'sleep-mom@example.com', 'password123');
    const babyRes = await request(app)
      .post('/api/babies')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Luna' });

    const babyId = babyRes.body.data._id;

    const invalidSleepRes = await request(app)
      .post(`/api/babies/${babyId}/logs`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'sleep',
        sleep: {
          start: '2026-10-07T06:00:00.000Z',
          end: '2026-10-07T05:00:00.000Z'
        }
      });

    expect(invalidSleepRes.statusCode).toBe(400);
    expect(invalidSleepRes.body.success).toBe(false);

    const invalidFeedRes = await request(app)
      .post(`/api/babies/${babyId}/logs`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'feed',
        feed: {
          amountMl: -5
        }
      });

    expect(invalidFeedRes.statusCode).toBe(400);
  });
});

describe('Additional care APIs', () => {
  const createApiUser = async (role = 'mother') => {
    const password = 'password1234';
    const user = await User.create({
      name: `API ${role}`,
      email: `api-${role}-${Date.now()}-${Math.random()}@example.com`,
      passwordHash: await bcrypt.hash(password, 12),
      role,
      isActive: true,
      isVerified: role === 'doctor'
    });
    const accessToken = jwt.sign(
      { sub: user._id.toString(), role: user.role },
      env.jwtAccessSecret,
      { expiresIn: '15m' }
    );
    return { user, accessToken };
  };

  it('serves a disclosed wellbeing questionnaire and stores private screenings', async () => {
    const { user, accessToken } = await createApiUser();
    const questionnaireRes = await request(app).get('/api/ppd/questionnaires/active');
    expect(questionnaireRes.statusCode).toBe(200);
    expect(questionnaireRes.body.data.questions).toHaveLength(10);
    expect(questionnaireRes.body.data.disclaimer).toMatch(/not a diagnosis/i);

    const answers = questionnaireRes.body.data.questions.map((question) => ({
      questionId: question.id,
      score: question.id === 'q10' ? 1 : 0
    }));
    const screeningRes = await request(app)
      .post('/api/ppd/screenings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ answers });

    expect(screeningRes.statusCode).toBe(201);
    expect(screeningRes.body.data.screening.flaggedSelfHarm).toBe(true);
    expect(screeningRes.body.data.screening.riskLevel).toBe('critical');

    const riskRes = await request(app)
      .get('/api/ppd/risk-status')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(riskRes.body.data.latest._id).toBe(screeningRes.body.data.screening._id);
    expect(riskRes.body.data.latest.mother).toBe(String(user._id));

    const invalidRes = await request(app)
      .post('/api/ppd/screenings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ answers: answers.slice(0, -1) });
    expect(invalidRes.statusCode).toBe(400);
    expect(invalidRes.body.errors).toHaveLength(1);
  });

  it('creates and updates reminders with ownership enforced', async () => {
    const { accessToken } = await createApiUser();
    const createRes = await request(app)
      .post('/api/reminders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'medication',
        title: 'Daily vitamins',
        scheduleType: 'daily',
        times: ['09:00'],
        daysOfWeek: [],
        timezone: 'UTC'
      });
    expect(createRes.statusCode).toBe(201);

    const reminderId = createRes.body.data._id;
    const completeRes = await request(app)
      .post(`/api/reminders/${reminderId}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ occurrenceKey: '2026-11-28' });
    expect(completeRes.statusCode).toBe(200);
    expect(completeRes.body.data.completionKeys).toContain('2026-11-28');

    const listRes = await request(app)
      .get('/api/reminders?limit=100')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(listRes.body.data.items.map((item) => item._id)).toContain(reminderId);
  });

  it('keeps anonymous forum authors private and lets users submit reports', async () => {
    const { accessToken } = await createApiUser();
    const postRes = await request(app)
      .post('/api/forum/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'A support question', body: 'Looking for kind advice.', isAnonymous: true, tags: ['support'] });
    expect(postRes.statusCode).toBe(201);

    const postId = postRes.body.data._id;
    const detailRes = await request(app).get(`/api/forum/posts/${postId}`);
    expect(detailRes.body.data.author).toBeNull();
    expect(detailRes.body.data.authorDisplay).toBe('Anonymous member');
    const ownDetailRes = await request(app)
      .get(`/api/forum/posts/${postId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(ownDetailRes.body.data.author).toBe(postRes.body.data.author);

    const commentRes = await request(app)
      .post(`/api/forum/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ body: 'Thank you for sharing.' });
    expect(commentRes.statusCode).toBe(201);
    const commentId = commentRes.body.data.comments[0]._id;

    const reportRes = await request(app)
      .post(`/api/forum/posts/${postId}/report`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ targetType: 'comment', targetId: commentId, reason: 'Test moderation flow.' });
    expect(reportRes.statusCode).toBe(201);

    const admin = await createApiUser('admin');
    const queueRes = await request(app)
      .get('/api/admin/reports?limit=100')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    const report = queueRes.body.data.items.find((item) => item.kind === 'report');
    expect(report).toBeTruthy();
    const moderateRes = await request(app)
      .patch(`/api/admin/reports/${report.report._id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ action: 'dismiss', kind: 'report' });
    expect(moderateRes.statusCode).toBe(200);
  });

  it('accepts family invitations and enforces the selected sharing scope', async () => {
    const mother = await createApiUser();
    const invitationRes = await request(app)
      .post('/api/family/invites')
      .set('Authorization', `Bearer ${mother.accessToken}`)
      .send({
        email: `family-${Date.now()}@example.com`,
        permissions: {
          viewBabyLogs: false,
          viewRecovery: false,
          viewMood: true,
          logBabyData: false
        }
      });
    expect(invitationRes.statusCode).toBe(201);

    const token = new URL(
      invitationRes.body.data.invitationPath,
      'http://localhost'
    ).searchParams.get('token');
    const acceptRes = await request(app)
      .post(`/api/family/invites/${token}/accept`)
      .send({ name: 'Trusted Relative', password: 'family-password-123' });
    expect(acceptRes.statusCode).toBe(201);
    expect(acceptRes.body.data.user.role).toBe('family');

    const dashboardRes = await request(app)
      .get(`/api/family/mothers/${mother.user._id}/dashboard`)
      .set('Authorization', `Bearer ${acceptRes.body.data.accessToken}`);
    expect(dashboardRes.statusCode).toBe(200);
    expect(dashboardRes.body.data.permissions.viewBabyLogs).toBe(false);
    expect(dashboardRes.body.data.moodSupportIndicator).toBeNull();
  });

  it('supports verified consultant slots and prevents duplicate appointment bookings', async () => {
    const { accessToken } = await createApiUser();
    const consultant = await LactationConsultant.create({
      name: 'Test Consultant',
      qualification: 'Lactation consultant',
      timezone: 'UTC',
      availableDays: [0, 1, 2, 3, 4, 5, 6],
      startTime: '00:00',
      endTime: '23:00'
    });
    const appointmentDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const slotsRes = await request(app)
      .get(`/api/lactation/consultants/${consultant._id}/slots?date=${appointmentDate}`);
    expect(slotsRes.statusCode).toBe(200);
    expect(slotsRes.body.data.slots.length).toBeGreaterThan(0);

    const bookingInput = {
      consultantId: String(consultant._id),
      slotStart: slotsRes.body.data.slots[0].slotStart,
      mode: 'video',
      reason: 'Feeding support'
    };
    const bookingRes = await request(app)
      .post('/api/lactation/bookings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(bookingInput);
    expect(bookingRes.statusCode).toBe(201);

    const duplicateRes = await request(app)
      .post('/api/lactation/bookings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(bookingInput);
    expect(duplicateRes.statusCode).toBe(409);
  });

  it('exports account data before deleting identity and retains only de-identified metrics', async () => {
    const { user, accessToken } = await createApiUser();
    const profileRes = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        deliveryDate: '2026-10-01',
        deliveryType: 'normal',
        complications: [],
        emergencyContact: { name: 'Contact', phone: '5550100' }
      });
    expect(profileRes.statusCode).toBe(200);

    const exportRes = await request(app)
      .get('/api/auth/export')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(exportRes.statusCode).toBe(200);
    expect(exportRes.body.data.profile.emergencyContact.name).toBe('Contact');

    const deleteRes = await request(app)
      .delete('/api/auth/account')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password: 'password1234' });
    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.success).toBe(true);
    expect(await User.findById(user._id)).toBeNull();
    const archive = await DeidentifiedArchive.findOne().sort({ createdAt: -1 }).lean();
    expect(archive.data).not.toHaveProperty('name');
    expect(archive.data).not.toHaveProperty('email');
  });
});
