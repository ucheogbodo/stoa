// app/garden/projects/[id]/page.tsx
// Project Workbench — shows linked ideas and uploaded reference files.
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import FileUpload from "@/components/FileUpload";

export default async function ProjectWorkbenchPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;
  const project = await prisma.project.findFirst({
    where: { id: params.id, userId },
    include: {
      ideas: {
        include: {
          idea: {
            select: {
              id: true,
              title: true,
              status: true,
              verificationStatus: true,
              updatedAt: true,
            },
          },
        },
        orderBy: { idea: { updatedAt: "desc" } },
      },
      files: { orderBy: { uploadedAt: "desc" } },
    },
  });

  if (!project) notFound();

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <Link href="/garden/projects" className="text-sm text-ink-muted hover:text-sage mb-3 inline-block">
          &larr; All Projects
        </Link>
        <h1 className="font-serif text-3xl text-ink">{project.name}</h1>
        {project.description && (
          <p className="text-ink-muted mt-2">{project.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Ideas Panel (3/5) */}
        <div className="lg:col-span-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted mb-4">
            Linked Ideas
          </h2>
          {project.ideas.length === 0 ? (
            <p className="text-ink-muted text-sm py-6">
              No ideas linked yet. Open an idea from the Garden and add it to this project.
            </p>
          ) : (
            <ul className="space-y-3">
              {project.ideas.map(({ idea }) => (
                <li key={idea.id}>
                  <Link
                    href={`/garden/ideas/${idea.id}`}
                    className="flex items-center justify-between p-4 bg-white border border-parchment-dark rounded-lg hover:border-sage transition-colors"
                  >
                    <span className="font-medium text-ink truncate">{idea.title}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ml-3 flex-shrink-0 ${
                        idea.status === "PUBLISHED"
                          ? "bg-ink text-parchment"
                          : idea.status === "GROWING"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-sage/20 text-sage"
                      }`}
                    >
                      {idea.status.toLowerCase()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Files Panel (2/5) */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted mb-4">
            Reference Files
          </h2>
          <FileUpload projectId={project.id} />
          {project.files.length > 0 && (
            <ul className="mt-4 space-y-2">
              {project.files.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-parchment rounded-lg text-sm"
                >
                  <span className="truncate text-ink">{file.filename}</span>
                  <span className="text-ink-muted ml-2 flex-shrink-0 text-xs">
                    {file.sizeBytes ? `${Math.round(file.sizeBytes / 1024)} KB` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
