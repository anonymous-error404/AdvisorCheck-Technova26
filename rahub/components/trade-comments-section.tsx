"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface Comment {
  id: string
  investor_id: string
  trade_id: string
  rating: number
  comment_text: string
  created_at: string
  investors?: { full_name: string }
}

export function TradeCommentsSection({ tradeId, advisorId }: { tradeId: string; advisorId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [rating, setRating] = useState(5)
  const [commentText, setCommentText] = useState("")
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUserId(session?.user.id || null)
    }
    getSession()

    fetchComments()
  }, [tradeId])

  const fetchComments = async () => {
    const { data } = await supabase
      .from("trade_comments")
      .select("*, investors(full_name)")
      .eq("trade_id", tradeId)
      .order("created_at", { ascending: false })

    setComments(data || [])
  }

  const handleAddComment = async () => {
    if (!userId) return

    setLoading(true)
    const { error } = await supabase.from("trade_comments").insert([
      {
        trade_id: tradeId,
        investor_id: userId,
        rating,
        comment_text: commentText,
      },
    ])

    if (!error) {
      setCommentText("")
      setRating(5)
      fetchComments()
    }

    setLoading(false)
  }

  const avgRating =
    comments.length > 0 ? (comments.reduce((sum, c) => sum + c.rating, 0) / comments.length).toFixed(1) : 0

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Comments & Ratings</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Average Rating */}
        {comments.length > 0 && (
          <div className="mb-6 flex items-center gap-2">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={20}
                  className={i < Math.round(Number(avgRating)) ? "fill-primary text-primary" : "text-text-secondary"}
                />
              ))}
            </div>
            <span className="text-sm text-text-secondary">
              {avgRating} / 5 ({comments.length} ratings)
            </span>
          </div>
        )}

        {/* Add Comment Form */}
        {userId && (
          <div className="mb-6 pb-6 border-b border-border">
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">Your Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setRating(star)} className="transition hover:scale-110">
                    <Star size={24} className={star <= rating ? "fill-primary text-primary" : "text-text-secondary"} />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              placeholder="Share your thoughts about this trade..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full bg-background border border-border rounded-lg p-3 text-text-primary mb-3"
              rows={3}
            />
            <Button
              onClick={handleAddComment}
              disabled={loading || !commentText.trim()}
              className="bg-primary text-background"
            >
              Post Comment
            </Button>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-text-secondary text-center py-6">
              No comments yet. Be the first to share your thoughts!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-background border border-border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{comment.investors?.full_name || "Anonymous"}</h4>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < comment.rating ? "fill-primary text-primary" : "text-text-secondary"}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-text-secondary mb-2">{new Date(comment.created_at).toLocaleDateString()}</p>
                <p className="text-text-primary">{comment.comment_text}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
