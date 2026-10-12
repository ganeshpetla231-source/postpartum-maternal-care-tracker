import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../api/apiClient';

const tags = ['support', 'recovery', 'feeding', 'sleep', 'mood', 'new-parent'];

function ForumPage() {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [postTags, setPostTags] = useState([]);
  const [anonymous, setAnonymous] = useState(false);
  const [comment, setComment] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportTarget, setReportTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPosts = useCallback(async () => {
    const params = new URLSearchParams({ limit: '50' });
    if (query.trim()) params.set('search', query.trim());
    if (tag) params.set('tag', tag);
    const response = await apiClient.get(`/forum/posts?${params}`);
    setPosts(response.data.data.items);
  }, [query, tag]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadPosts()
      .catch((error) => toast.error(error.response?.data?.message || 'Community posts could not be loaded.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [loadPosts]);

  async function openPost(postId) {
    try {
      const response = await apiClient.get(`/forum/posts/${postId}`);
      setSelectedPost(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Post could not be loaded.');
    }
  }

  async function submitPost(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await apiClient.post('/forum/posts', {
        title,
        body,
        tags: postTags,
        isAnonymous: anonymous
      });
      setTitle('');
      setBody('');
      setPostTags([]);
      setAnonymous(false);
      if (response.data.data.supportResources) {
        toast.info('If you may be in immediate danger, contact emergency services. Support resources are shown with your post.');
      } else {
        toast.success('Your post has been shared with the community.');
      }
      await loadPosts();
      setSelectedPost(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Your post could not be shared.');
    } finally {
      setSaving(false);
    }
  }

  async function submitComment(event) {
    event.preventDefault();
    if (!selectedPost) return;
    try {
      await apiClient.post(`/forum/posts/${selectedPost._id}/comments`, { body: comment });
      setComment('');
      await openPost(selectedPost._id);
      await loadPosts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Comment could not be added.');
    }
  }

  async function submitReport(event) {
    event.preventDefault();
    if (!selectedPost || !reportTarget) return;
    try {
      await apiClient.post(`/forum/posts/${selectedPost._id}/report`, {
        targetType: reportTarget.type,
        targetId: reportTarget.id,
        reason: reportReason
      });
      setReportTarget(null);
      setReportReason('');
      toast.success('Thank you. A moderator will review this report.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Report could not be submitted.');
    }
  }

  async function deletePost() {
    if (!selectedPost || !window.confirm('Delete this post and its comments?')) return;
    try {
      await apiClient.delete(`/forum/posts/${selectedPost._id}`);
      setSelectedPost(null);
      await loadPosts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Post could not be deleted.');
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-pink-700">Community</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">A place to share and support</h1>
        <p className="mt-2 text-slate-600">Share with care. This community is not an emergency service.</p>
      </header>

      <form onSubmit={submitPost} className="mt-6 rounded-xl border border-slate-200 p-5">
        <h2 className="text-xl font-semibold text-slate-900">Start a conversation</h2>
        <label className="mt-3 block text-sm font-medium text-slate-700" htmlFor="post-title">
          Title
        </label>
        <input
          id="post-title"
          required
          maxLength={160}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
        <label className="mt-3 block text-sm font-medium text-slate-700" htmlFor="post-body">
          Your message
        </label>
        <textarea
          id="post-body"
          required
          maxLength={10000}
          rows={4}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
        <fieldset className="mt-3">
          <legend className="text-sm font-medium text-slate-700">Topics</legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {tags.map((value) => (
              <label key={value} className="flex items-center gap-1 text-sm capitalize text-slate-700">
                <input
                  type="checkbox"
                  checked={postTags.includes(value)}
                  onChange={(event) =>
                    setPostTags((current) =>
                      event.target.checked ? [...current, value] : current.filter((item) => item !== value)
                    )
                  }
                  className="accent-pink-700"
                />
                {value.replace('-', ' ')}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(event) => setAnonymous(event.target.checked)}
            className="accent-pink-700"
          />
          Post anonymously
        </label>
        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-lg bg-pink-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          {saving ? 'Sharing…' : 'Share with the community'}
        </button>
      </form>

      <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(17rem,0.9fr)_minmax(0,1.5fr)]">
        <section aria-labelledby="forum-feed-title">
          <h2 id="forum-feed-title" className="text-xl font-semibold text-slate-900">Community posts</h2>
          <div className="mt-3 flex gap-2">
            <label className="sr-only" htmlFor="forum-search">Search community</label>
            <input
              id="forum-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <label className="sr-only" htmlFor="forum-tag">Filter by topic</label>
            <select
              id="forum-tag"
              value={tag}
              onChange={(event) => setTag(event.target.value)}
              className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
            >
              <option value="">All topics</option>
              {tags.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
          {loading ? (
            <p role="status" className="mt-4 text-sm text-slate-500">Loading posts…</p>
          ) : posts.length === 0 ? (
            <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">No posts found.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {posts.map((post) => (
                <li key={post._id}>
                  <button
                    type="button"
                    onClick={() => openPost(post._id)}
                    className={`w-full rounded-xl border p-4 text-left ${
                      selectedPost?._id === post._id ? 'border-pink-500 bg-pink-50' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-semibold text-slate-900">{post.title}</span>
                    <span className="mt-1 block line-clamp-3 text-sm text-slate-600">{post.body}</span>
                    <span className="mt-2 block text-xs text-slate-500">
                      {post.authorDisplay || post.author?.name || 'Community member'} · {post.commentsCount} replies
                    </span>
                    <span className="mt-2 flex flex-wrap gap-1">
                      {post.tags?.map((value) => (
                        <span key={value} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{value}</span>
                      ))}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="post-detail-title" className="rounded-xl border border-slate-200 p-5">
          {selectedPost ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">
                    {selectedPost.authorDisplay || selectedPost.author?.name || 'Community member'} · {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(selectedPost.createdAt))}
                  </p>
                  <h2 id="post-detail-title" className="mt-1 text-2xl font-semibold text-slate-900">{selectedPost.title}</h2>
                </div>
                <div className="flex gap-2">
                  {selectedPost.supportResources && (
                    <span className="text-xs font-semibold text-rose-700">Support resources available</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setReportTarget({ type: 'post', id: selectedPost._id })}
                    className="text-sm text-slate-600 underline"
                  >
                    Report
                  </button>
                  {selectedPost.author && typeof selectedPost.author === 'string' && (
                    <button type="button" onClick={deletePost} className="text-sm text-rose-700 underline">
                      Delete
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-slate-700">{selectedPost.body}</p>
              {selectedPost.supportResources && (
                <aside className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
                  <p className="font-semibold">Support is available</p>
                  <p className="mt-1">If you may be in immediate danger, contact emergency services or someone you trust.</p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {selectedPost.supportResources.map((resource) => (
                      <a key={resource.phone} href={`tel:${resource.phone}`} className="font-semibold underline">
                        {resource.name}: {resource.phone}
                      </a>
                    ))}
                  </div>
                </aside>
              )}
              <h3 className="mt-7 font-semibold text-slate-900">Replies</h3>
              <ul className="mt-2 divide-y divide-slate-100">
                {selectedPost.comments?.map((item) => (
                  <li key={item._id} className="py-3">
                    <p className="text-xs text-slate-500">{item.authorDisplay} · {new Intl.DateTimeFormat(undefined, { dateStyle: 'short' }).format(new Date(item.createdAt))}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{item.body}</p>
                    <button
                      type="button"
                      onClick={() => setReportTarget({ type: 'comment', id: item._id })}
                      className="mt-1 text-xs text-slate-500 underline"
                    >
                      Report reply
                    </button>
                  </li>
                ))}
                {selectedPost.comments?.length === 0 && <li className="py-3 text-sm text-slate-500">No replies yet.</li>}
              </ul>
              <form onSubmit={submitComment} className="mt-4">
                <label htmlFor="forum-comment" className="sr-only">Write a reply</label>
                <textarea
                  id="forum-comment"
                  required
                  maxLength={4000}
                  rows={3}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Write a kind, supportive reply…"
                  className="w-full rounded-lg border border-slate-300 p-3 text-sm"
                />
                <button type="submit" className="mt-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white">
                  Add reply
                </button>
              </form>
            </>
          ) : (
            <p className="text-sm text-slate-500">Select a post to read the conversation.</p>
          )}
        </section>
      </div>

      {reportTarget && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4">
          <form onSubmit={submitReport} className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-900">Report content</h2>
            <label htmlFor="report-reason" className="mt-3 block text-sm text-slate-700">
              Tell moderators why you are reporting this
            </label>
            <textarea
              id="report-reason"
              required
              maxLength={1000}
              rows={4}
              value={reportReason}
              onChange={(event) => setReportReason(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-3"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setReportTarget(null)} className="rounded-lg px-4 py-2 text-sm text-slate-600">
                Cancel
              </button>
              <button type="submit" className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white">
                Send report
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ForumPage;
