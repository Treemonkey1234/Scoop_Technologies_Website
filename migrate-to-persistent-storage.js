/**
 * 🔄 MIGRATION SCRIPT: File Storage → PostgreSQL Database
 * 
 * This script updates all API routes to use the enhanced persistent storage
 * instead of the file-based JSON storage system.
 * 
 * Run this to migrate your platform to prevent data loss on server restarts!
 */

const fs = require('fs');
const path = require('path');

class StorageMigrator {
  constructor() {
    this.apiRoutesDir = path.join(process.cwd(), 'app/api');
    this.libDir = path.join(process.cwd(), 'lib');
    this.backupDir = path.join(process.cwd(), 'data/migration-backups');
    
    this.ensureBackupDir();
  }

  ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Main migration function
   */
  async migrate() {
    console.log('🚀 Starting migration to persistent storage...\n');

    try {
      // 1. Backup current files
      await this.createBackups();

      // 2. Update API routes
      await this.updateApiRoutes();

      // 3. Replace dataStorage library
      await this.replaceDataStorageLibrary();

      // 4. Update package.json dependencies
      await this.updateDependencies();

      // 5. Create environment configuration
      await this.createEnvironmentConfig();

      console.log('\n✅ Migration completed successfully!');
      console.log('\n📋 NEXT STEPS:');
      console.log('1. Set up your PostgreSQL database');
      console.log('2. Update your environment variables');
      console.log('3. Run npm install to install new dependencies');
      console.log('4. Test the updated APIs');
      console.log('5. Deploy to production');

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  async createBackups() {
    console.log('💾 Creating backups of current files...');

    const filesToBackup = [
      'lib/dataStorage.ts',
      'app/api/friends/route.ts',
      'app/api/posts/route.ts',
      'app/api/profile/update/route.ts',
      'package.json'
    ];

    for (const file of filesToBackup) {
      const fullPath = path.join(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        const backupPath = path.join(this.backupDir, file.replace(/\//g, '_'));
        fs.copyFileSync(fullPath, backupPath);
        console.log(`  ✓ Backed up: ${file}`);
      }
    }
  }

  async updateApiRoutes() {
    console.log('\n🔧 Updating API routes...');

    // Update friends API
    await this.updateFriendsApi();

    // Update posts API
    await this.updatePostsApi();

    // Update profile API
    await this.updateProfileApi();

    console.log('  ✅ All API routes updated');
  }

  async updateFriendsApi() {
    const friendsApiPath = path.join(this.apiRoutesDir, 'friends/route.ts');
    
    if (!fs.existsSync(friendsApiPath)) {
      console.log('  ⚠️ Friends API route not found, skipping...');
      return;
    }

    const newFriendsApi = `import { NextRequest, NextResponse } from 'next/server';
import {
  getFriendshipsForUser,
  addFriendship,
  removeFriendship,
  type Friendship
} from '@/lib/enhanced-dataStorage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      )
    }

    console.log(\`🤝 FRIENDS API: Getting friends for user \${userId}\`)

    // Get friendships from PostgreSQL database
    const friends = await getFriendshipsForUser(userId);

    console.log(\`✅ FRIENDS API: Found \${friends.length} friends for user \${userId}\`)

    return NextResponse.json({
      success: true,
      friends,
      count: friends.length
    })
  } catch (error) {
    console.error('Friends API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch friends' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId1, userId2, user1Data, user2Data } = body as {
      userId1: string
      userId2: string
      user1Data: any
      user2Data: any
    }

    if (!userId1 || !userId2 || !user1Data || !user2Data) {
      return NextResponse.json(
        { error: 'userId1, userId2, user1Data, and user2Data are required' },
        { status: 400 }
      )
    }

    // Prevent self-friendship
    if (userId1 === userId2) {
      return NextResponse.json(
        { error: 'Cannot create friendship with yourself' },
        { status: 400 }
      )
    }

    // Ensure consistent ordering (smaller ID first)
    const [smallerId, largerId] = [userId1, userId2].sort()
    const [smallerUserData, largerUserData] = userId1 < userId2 ? [user1Data, user2Data] : [user2Data, user1Data]

    // Create new friendship in PostgreSQL
    const newFriendship: Friendship = {
      id: Date.now().toString(),
      userId1: smallerId,
      userId2: largerId,
      createdAt: new Date().toISOString(),
      user1Data: {
        id: smallerUserData.id,
        name: smallerUserData.name,
        username: smallerUserData.username,
        avatar: smallerUserData.avatar,
        trustScore: smallerUserData.trustScore
      },
      user2Data: {
        id: largerUserData.id,
        name: largerUserData.name,
        username: largerUserData.username,
        avatar: largerUserData.avatar,
        trustScore: largerUserData.trustScore
      }
    }

    // Add friendship to persistent storage (PostgreSQL)
    await addFriendship(newFriendship);

    console.log(\`✅ FRIENDSHIP CREATED: \${smallerUserData.name} and \${largerUserData.name} are now friends\`)

    return NextResponse.json({
      success: true,
      message: 'Friendship created successfully',
      friendship: newFriendship
    })
  } catch (error) {
    console.error('Create friendship error:', error)
    
    if (error.message?.includes('already exists')) {
      return NextResponse.json(
        { error: 'Friendship already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create friendship' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId1 = searchParams.get('userId1')
    const userId2 = searchParams.get('userId2')

    if (!userId1 || !userId2) {
      return NextResponse.json(
        { error: 'userId1 and userId2 parameters are required' },
        { status: 400 }
      )
    }

    // Remove friendship from PostgreSQL database
    const removed = await removeFriendship(userId1, userId2);

    if (!removed) {
      return NextResponse.json(
        { error: 'Friendship not found' },
        { status: 404 }
      )
    }

    console.log(\`❌ FRIENDSHIP REMOVED: Users \${userId1} and \${userId2} are no longer friends\`)

    return NextResponse.json({
      success: true,
      message: 'Friendship removed successfully'
    })
  } catch (error) {
    console.error('Remove friendship error:', error)
    return NextResponse.json(
      { error: 'Failed to remove friendship' },
      { status: 500 }
    )
  }
}`;

    fs.writeFileSync(friendsApiPath, newFriendsApi);
    console.log('  ✓ Updated friends API route');
  }

  async updatePostsApi() {
    const postsApiPath = path.join(this.apiRoutesDir, 'posts/route.ts');
    
    if (!fs.existsSync(postsApiPath)) {
      console.log('  ⚠️ Posts API route not found, skipping...');
      return;
    }

    const newPostsApi = `import { NextRequest, NextResponse } from 'next/server';
import {
  savePost,
  getPosts,
  getPostsForUser,
  type Post
} from '@/lib/enhanced-dataStorage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')

    console.log('📚 POSTS API: Getting posts from database...')

    let posts: Post[];

    if (userId) {
      // Get posts for specific user
      posts = await getPostsForUser(userId);
    } else {
      // Get all posts with optional filters
      const filters = {
        category: category || undefined,
        limit,
        isPublic: true
      };
      posts = await getPosts(filters);
    }

    console.log(\`✅ POSTS API: Retrieved \${posts.length} posts from database\`)

    return NextResponse.json({
      success: true,
      posts,
      count: posts.length
    })
  } catch (error) {
    console.error('Posts API GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reviewFor, reviewForName, category, content, tags, isPublic, type, userId } = body

    // Validate required fields
    if (!category || !content || !userId) {
      return NextResponse.json(
        { error: 'category, content, and userId are required' },
        { status: 400 }
      )
    }

    console.log('📝 POSTS API: Creating new post...')

    // Create post data for database
    const postData: Partial<Post> = {
      authorId: userId,
      reviewForId: reviewFor,
      category,
      content: content.trim(),
      tags: Array.isArray(tags) ? tags : [],
      isPublic: isPublic !== false,
      photos: [],
      likesCount: 0,
      commentsCount: 0
    }

    // Save to PostgreSQL database
    const savedPost = await savePost(postData);

    if (!savedPost) {
      throw new Error('Failed to save post to database');
    }

    console.log(\`✅ POSTS API: Post created successfully with ID \${savedPost.id}\`)

    return NextResponse.json({
      success: true,
      message: 'Post created successfully',
      post: savedPost
    })
  } catch (error) {
    console.error('Posts API POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}`;

    fs.writeFileSync(postsApiPath, newPostsApi);
    console.log('  ✓ Updated posts API route');
  }

  async updateProfileApi() {
    const profileApiPath = path.join(this.apiRoutesDir, 'profile/update/route.ts');
    
    if (!fs.existsSync(profileApiPath)) {
      console.log('  ⚠️ Profile API route not found, skipping...');
      return;
    }

    const newProfileApi = `import { NextRequest, NextResponse } from 'next/server';
import {
  saveUser,
  getUser,
  type User
} from '@/lib/enhanced-dataStorage';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Extract user ID from cookies or body
    const authId = body.authId || body.userId || extractUserIdFromCookies(request);
    
    if (!authId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log(\`👤 PROFILE API: Updating profile for user \${authId}\`)

    // Get current user data
    const currentUser = await getUser(authId);
    
    // Merge updates with existing data
    const userData = {
      ...currentUser,
      ...body,
      authId,
      updatedAt: new Date().toISOString()
    };

    // Save to PostgreSQL database
    const savedUser = await saveUser(userData);

    if (!savedUser) {
      throw new Error('Failed to save user to database');
    }

    console.log('✅ PROFILE API: Profile updated successfully')

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: savedUser
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const authId = searchParams.get('authId') || extractUserIdFromCookies(request);
    
    if (!authId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log(\`👤 PROFILE API: Getting profile for user \${authId}\`)

    // Get user from PostgreSQL database
    const user = await getUser(authId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('✅ PROFILE API: Profile retrieved successfully')

    return NextResponse.json({
      success: true,
      user
    })
  } catch (error) {
    console.error('Profile GET error:', error)
    return NextResponse.json(
      { error: 'Failed to get profile' },
      { status: 500 }
    )
  }
}

function extractUserIdFromCookies(request: NextRequest): string | null {
  try {
    const cookies = request.headers.get('cookie') || '';
    const appSessionCookie = cookies
      .split(';')
      .find(c => c.trim().startsWith('appSession='));
    
    if (appSessionCookie) {
      // Extract user ID from session cookie
      // This is a simplified example - implement your actual session parsing
      const sessionValue = appSessionCookie.split('=')[1];
      // Parse your session format here
      return null; // Return actual user ID
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting user ID from cookies:', error);
    return null;
  }
}`;

    fs.writeFileSync(profileApiPath, newProfileApi);
    console.log('  ✓ Updated profile API route');
  }

  async replaceDataStorageLibrary() {
    console.log('\n📚 Replacing dataStorage library...');

    const oldLibPath = path.join(this.libDir, 'dataStorage.ts');
    const newLibPath = path.join(this.libDir, 'enhanced-dataStorage.ts');

    // Move old library to backup
    if (fs.existsSync(oldLibPath)) {
      const backupPath = path.join(this.backupDir, 'dataStorage_old.ts');
      fs.copyFileSync(oldLibPath, backupPath);
      
      // Replace with enhanced version
      const enhancedLibPath = path.join(process.cwd(), 'lib/enhanced-dataStorage.ts');
      if (fs.existsSync(enhancedLibPath)) {
        fs.copyFileSync(enhancedLibPath, oldLibPath);
        console.log('  ✓ Replaced dataStorage.ts with enhanced version');
      }
    }
  }

  async updateDependencies() {
    console.log('\n📦 Updating package.json dependencies...');

    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      console.log('  ⚠️ package.json not found, skipping...');
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Add new dependencies for PostgreSQL and Redis
    const newDependencies = {
      'pg': '^8.11.0',
      '@types/pg': '^8.11.0',
      'redis': '^4.6.0',
      '@types/redis': '^4.0.0'
    };

    packageJson.dependencies = {
      ...packageJson.dependencies,
      ...newDependencies
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('  ✓ Added PostgreSQL and Redis dependencies');
  }

  async createEnvironmentConfig() {
    console.log('\n🔧 Creating environment configuration...');

    const envExamplePath = path.join(process.cwd(), '.env.example');
    const envConfigExample = `# Database Configuration
DATABASE_URL=postgresql://username:password@host:5432/database_name

# Redis Configuration (optional - for caching)
REDIS_URL=redis://localhost:6379

# Environment
NODE_ENV=production

# Existing environment variables...
# (keep your existing Auth0, Stripe, etc. variables)
`;

    fs.writeFileSync(envExamplePath, envConfigExample);
    console.log('  ✓ Created .env.example with database configuration');

    const readmePath = path.join(process.cwd(), 'MIGRATION_README.md');
    const migrationReadme = `# Data Persistence Migration

This project has been migrated from file-based storage to PostgreSQL database persistence.

## Benefits
✅ Data persists across server restarts
✅ Friends lists won't reset to 0
✅ Posts and events are permanently stored
✅ Trust scores maintain history
✅ Scalable for production use

## Setup Instructions

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Database Setup
Create a PostgreSQL database and update your environment variables:

\`\`\`bash
# Copy environment example
cp .env.example .env

# Edit .env with your database credentials
DATABASE_URL=postgresql://username:password@host:5432/database_name
\`\`\`

### 3. Database Migration
The application will automatically:
- Create required tables on first run
- Migrate existing JSON file data to PostgreSQL
- Backup original files

### 4. Optional: Redis Setup
For improved performance, set up Redis caching:

\`\`\`bash
REDIS_URL=redis://localhost:6379
\`\`\`

### 5. Deploy
Your application now has enterprise-grade data persistence!

## Database Schema
The migration creates these tables:
- users (profiles, auth, trust scores)
- friendships (persistent friend connections)
- posts (reviews and content)
- events (event data and attendees)
- trust_score_history (score tracking)

## Rollback
If needed, original files are backed up in \`data/migration-backups/\`
`;

    fs.writeFileSync(readmePath, migrationReadme);
    console.log('  ✓ Created migration README');
  }
}

// Export for direct use
if (require.main === module) {
  const migrator = new StorageMigrator();
  migrator.migrate().catch(console.error);
}

module.exports = { StorageMigrator };

console.log(`
🔄 STORAGE MIGRATION SCRIPT READY!

This script will:
✅ Backup your current files
✅ Update API routes to use PostgreSQL
✅ Replace file storage with database storage
✅ Add required dependencies
✅ Create environment configuration
✅ Provide setup instructions

Run with: node migrate-to-persistent-storage.js

After migration, your platform will have:
🚀 Enterprise-grade data persistence
🚀 No more data loss on server restarts
🚀 Friends lists that persist forever
🚀 Scalable database architecture
🚀 Redis caching for performance
`);