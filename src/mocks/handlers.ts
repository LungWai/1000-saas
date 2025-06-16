import { rest } from 'msw';

export const handlers = [
  rest.get('/api/grids', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        { 
          id: '1', 
          status: 'empty', 
          price: 100,
          title: 'Test Grid 1',
          description: 'This is a test grid'
        },
        { 
          id: '2', 
          status: 'leased', 
          price: 200,
          title: 'Test Grid 2',
          description: 'This is another test grid',
          content: 'Sample content'
        },
      ])
    );
  }),
  
  rest.put('/api/grids/:id/content', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json({ success: true, id })
    );
  }),

  rest.post('/api/checkout/create-session', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        sessionId: 'test-session',
        url: '/success?session_id=test-session'
      })
    );
  }),
]; 