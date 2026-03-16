#!/usr/bin/env python3
"""Surgical fix for specific conflict markers"""

fixes = {
    'src/app/api/auth/verify/route.ts': [
        # Remove >>>>>>> marker on line 73, and resolve the conflict on lines 78-82
        ('>>>>>>> 285550973379e98ffdd5e0ae52763a57b765120a\n\n  const res = NextResponse.json({',
         'const res = NextResponse.json({'),
        # Keep HEAD version (with userId only, no displayName)
        ('<<<<<<< HEAD\n    userId: dbUser?._id?.toString() ?? null,\n=======\n    displayName: dbUser?.displayName ?? dbUser?.username ?? null,\n    userId: dbUser?._id?.toString() ?? null,\n    onboardingCompleted: !!dbUser?.onboardingCompleted,\n    onboardingStep: dbUser?.onboardingStep ?? 1,\n    email: dbUser?.email ?? null,\n    walletLinked: true,\n    googleLinked: !!dbUser?.googleId,\n    emailLinked: !!dbUser?.email,\n    provider: "wallet",\n    isNewUser,\n    needsGoogleLink: !dbUser?.googleId,',
         'userId: dbUser?._id?.toString() ?? null,\n    onboardingCompleted: !!dbUser?.onboardingCompleted,\n    onboardingStep: dbUser?.onboardingStep ?? 1,\n    email: dbUser?.email ?? null,\n    walletLinked: true,\n    googleLinked: !!dbUser?.googleId,\n    emailLinked: !!dbUser?.email,\n    provider: "wallet",\n    isNewUser,\n    needsGoogleLink: !dbUser?.googleId,'),
    ],
    'src/app/api/auth/me/route.ts': [
        # Fix the syntax error - add missing opening brace/return
        ('displayName: dbUser.displayName ?? dbUser.username,\n              avatarUrl: dbUser.avatarUrl,',
         'return NextResponse.json({\n    displayName: dbUser.displayName ?? dbUser.username,\n    avatarUrl: dbUser.avatarUrl,'),
    ],
    'src/app/api/comments/[id]/vote/route.ts': [
        # Remove trailing merge marker
        ('>>>>>>> 285550973379e98ffdd5e0ae52763a57b765120a\n\ninterface RouteContext', 
         'interface RouteContext'),
        # Keep HEAD version (with blockchain reward)
        ('<<<<<<< HEAD\n    \n    // Trigger blockchain reward for upvotes asynchronously (fire and forget)\n    if (parsed.data.voteType === "up") {',
         '// Trigger blockchain reward for upvotes asynchronously (fire and forget)\n    if (parsed.data.voteType === "up") {'),
        # Remove bottom marker and duplicate
        ('=======    return NextResponse.json(result);\n   } catch',
         '} catch'),
    ],
}

for filepath, patterns in fixes.items():
    try:
        for enc in ['utf-8', 'latin-1', 'cp1252']:
            try:
                with open(filepath, 'r', encoding=enc) as f:
                    content = f.read()
                break
            except:
                continue
        
        for old, new in patterns:
            if old in content:
                content = content.replace(old, new)
                print(f'✓ {filepath}: Fix applied')
            else:
                print(f'⚠ {filepath}: Pattern not found (may already be fixed)')
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
    except Exception as e:
        print(f'✗ {filepath}: {e}')
