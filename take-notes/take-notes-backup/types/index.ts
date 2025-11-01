// export interface Note {
//   id: string
//   userId: string
//   title: string | null
  export interface Note {
    id: string;
    userId: string;
    title: string | null;
    content: string | null;
    categoryId: string | null;
    tags?: string[];
    isFavorite: boolean;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }

  export interface Category {
    id: string;
    userId: string;
    name: string;
    createdAt: string;
  }

  export interface User {
    app_metadata: Record<string, unknown>;
    aud: string;
    user_metadata: any;
    id: string;
    // Supabase User.email can be undefined for some providers; allow undefined
    email?: string | null;
    created_at: string;
  }

  export interface DragItem {
    id: string;
    type: "note" | "category";
    data: Note | Category;
  }
