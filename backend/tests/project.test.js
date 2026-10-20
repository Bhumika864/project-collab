const request = require('supertest');
const express = require('express');
const projectRoutes = require('../routes/projectRoutes');
const userRoutes = require('../routes/userRoutes');
const taskRoutes = require('../routes/taskRoutes');

const app = express();
app.use(express.json());
// We need user routes to log in and get a token
app.use('/api/users', userRoutes); 
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

describe('Project API', () => {
  let token;

  // Before running project tests, register and log in a user to get a token
  beforeEach(async () => {
    await request(app)
      .post('/api/users/register')
      .send({ name: 'Project Owner', email: 'owner@example.com', password: 'password' });
    
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'owner@example.com', password: 'password' });
    
    token = res.body.token;
  });

  it('should not allow an unauthenticated user to create a project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ title: 'A new project' });

    // Without a token, it should fail
    // Note: This requires your actual middleware, so this test is more of an integration test
    // For a pure unit test, you would "mock" the middleware. But this is great for this assignment.
    expect(res.statusCode).toEqual(401); 
  });

  it('should allow an authenticated user to create a project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`) // Set the auth header
      .send({
        title: 'My First Awesome Project',
        description: 'This is a test project.',
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.title).toBe('My First Awesome Project');
  });

  it('should enforce viewer and editor permissions for project tasks', async () => {
    const project = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Role test project' });

    await request(app).post('/api/users/register')
      .send({ name: 'Invitee', email: 'invitee@example.com', password: 'password' });
    const inviteeLogin = await request(app).post('/api/users/login')
      .send({ email: 'invitee@example.com', password: 'password' });
    const inviteeToken = inviteeLogin.body.token;

    const addMember = await request(app)
      .post(`/api/projects/${project.body._id}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'invitee@example.com', role: 'viewer' });
    expect(addMember.statusCode).toBe(200);

    const viewerProject = await request(app)
      .get(`/api/projects/${project.body._id}`)
      .set('Authorization', `Bearer ${inviteeToken}`);
    expect(viewerProject.body.role).toBe('viewer');
    expect(viewerProject.body.members[0].role).toBe('viewer');

    const deniedTask = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${inviteeToken}`)
      .send({ title: 'Viewer task', projectId: project.body._id });
    expect(deniedTask.statusCode).toBe(403);

    await request(app)
      .put(`/api/projects/${project.body._id}/members/${inviteeLogin.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'editor' });

    const allowedTask = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${inviteeToken}`)
      .send({ title: 'Editor task', projectId: project.body._id });
    expect(allowedTask.statusCode).toBe(201);

    const otherProject = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Other project' });
    const updateTask = await request(app)
      .put(`/api/tasks/${allowedTask.body._id}`)
      .set('Authorization', `Bearer ${inviteeToken}`)
      .send({ project: otherProject.body._id, title: 'Updated task' });
    expect(updateTask.statusCode).toBe(200);
    expect(updateTask.body.project).toBe(project.body._id);
  });

  it('should allow owners to create, accept, and revoke share links', async () => {
    const project = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Link invite project' });
    const invite = await request(app)
      .post(`/api/projects/${project.body._id}/invite-link`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'viewer' });

    expect(invite.statusCode).toBe(201);
    expect(invite.body.token).toBeDefined();

    await request(app).post('/api/users/register')
      .send({ name: 'Link invitee', email: 'link@example.com', password: 'password' });
    const login = await request(app).post('/api/users/login')
      .send({ email: 'link@example.com', password: 'password' });

    const accepted = await request(app)
      .post(`/api/projects/invitations/${invite.body.token}/accept`)
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(accepted.statusCode).toBe(200);
    const joinedProject = await request(app)
      .get(`/api/projects/${project.body._id}`)
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(joinedProject.body.role).toBe('viewer');

    await request(app)
      .delete(`/api/projects/${project.body._id}/invite-link`)
      .set('Authorization', `Bearer ${token}`);
    const rejected = await request(app)
      .post(`/api/projects/invitations/${invite.body.token}/accept`)
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(rejected.statusCode).toBe(404);
  });

  it('should record task activity and return project analytics', async () => {
    const project = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Insights project' });
    const task = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Tracked task', projectId: project.body._id });

    await request(app)
      .put(`/api/tasks/${task.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'InProgress' });
    await request(app)
      .put(`/api/tasks/${task.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Done' });
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Open task', projectId: project.body._id });

    const feed = await request(app)
      .get(`/api/projects/${project.body._id}/activity?action=updated`)
      .set('Authorization', `Bearer ${token}`);
    expect(feed.statusCode).toBe(200);
    expect(feed.body).toHaveLength(2);
    expect(feed.body[0].actor.name).toBe('Project Owner');
    expect(feed.body[0].changes.status.to).toBe('Done');

    const analytics = await request(app)
      .get(`/api/projects/${project.body._id}/analytics`)
      .set('Authorization', `Bearer ${token}`);
    expect(analytics.statusCode).toBe(200);
    expect(analytics.body.totalTasks).toBe(2);
    expect(analytics.body.completedTasks).toBe(1);
    expect(analytics.body.averageCycleTimeHours).not.toBeNull();
    expect(analytics.body.completionTrend.reduce((sum, day) => sum + day.completed, 0)).toBe(1);
    expect(analytics.body.workloadByMember[0].name).toBe('Unassigned');
  });
});