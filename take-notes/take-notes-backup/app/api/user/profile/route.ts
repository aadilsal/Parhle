import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  email: z.string().email().optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const updates = updateProfileSchema.parse(body)

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updateData: any = {}
    if (updates.email) updateData.email = updates.email
    if (updates.firstName || updates.lastName) {
      updateData.data = {
        ...user.user_metadata,
        first_name: updates.firstName || user.user_metadata.first_name,
        last_name: updates.lastName || user.user_metadata.last_name,
        full_name: `${updates.firstName || user.user_metadata.first_name} ${
          updates.lastName || user.user_metadata.last_name
        }`,
      }
    }

    const { data, error } = await supabase.auth.updateUser(updateData)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ user: data.user })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
