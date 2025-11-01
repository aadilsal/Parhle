-- Insert sample categories
INSERT INTO categories (user_id, name) VALUES
  ((SELECT id FROM auth.users LIMIT 1), 'Personal'),
  ((SELECT id FROM auth.users LIMIT 1), 'Work'),
  ((SELECT id FROM auth.users LIMIT 1), 'Ideas'),
  ((SELECT id FROM auth.users LIMIT 1), 'Projects');

-- Insert sample notes
INSERT INTO notes (user_id, title, content, category_id, is_favorite) VALUES
  (
    (SELECT id FROM auth.users LIMIT 1),
  'Welcome to Parhle!',
  '# Welcome to Parhle!

Parhle is a modern, AI-powered PDF note taker that helps you capture, organize, and enhance your thoughts.

## Features

- **Markdown Support**: Write notes in markdown with live preview
- **AI Integration**: Summarize, rephrase, and translate your notes
- **Categories**: Organize notes into custom categories
- **Favorites**: Mark important notes as favorites
- **Real-time Sync**: Your notes sync across all devices
- **Dark Mode**: Easy on the eyes with dark theme support

## Getting Started

1. Create your first note by clicking "New Note"
2. Organize notes with categories
3. Use AI tools to enhance your writing
4. Mark important notes as favorites

Happy note-taking! 📝',
    (SELECT id FROM categories WHERE name = 'Personal' LIMIT 1),
    true
  ),
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Project Planning Template',
    '# Project Planning Template

## Project Overview
- **Project Name**: 
- **Start Date**: 
- **End Date**: 
- **Project Manager**: 

## Objectives
- [ ] Objective 1
- [ ] Objective 2
- [ ] Objective 3

## Timeline
| Phase | Start Date | End Date | Status |
|-------|------------|----------|--------|
| Planning | | | |
| Development | | | |
| Testing | | | |
| Deployment | | | |

## Resources
- **Team Members**: 
- **Budget**: 
- **Tools**: 

## Risks & Mitigation
- **Risk 1**: 
  - *Mitigation*: 
- **Risk 2**: 
  - *Mitigation*: 

## Next Steps
- [ ] Action item 1
- [ ] Action item 2
- [ ] Action item 3',
    (SELECT id FROM categories WHERE name = 'Work' LIMIT 1),
    false
  ),
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Meeting Notes - Team Standup',
    '# Team Standup - [Date]

## Attendees
- John Doe
- Jane Smith
- Mike Johnson

## Agenda
1. Sprint progress review
2. Blockers discussion
3. Next sprint planning

## Discussion Points

### Sprint Progress
- Feature A: 80% complete
- Feature B: In testing phase
- Bug fixes: 5 resolved, 2 remaining

### Blockers
- API integration delay
- Design review pending

### Next Sprint
- Focus on performance optimization
- User testing feedback implementation

## Action Items
- [ ] John: Complete API integration by Friday
- [ ] Jane: Schedule design review meeting
- [ ] Mike: Prepare user testing report

## Next Meeting
**Date**: Next Monday, 9:00 AM
**Location**: Conference Room A',
    (SELECT id FROM categories WHERE name = 'Work' LIMIT 1),
    false
  );
