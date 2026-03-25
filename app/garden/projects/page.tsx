// app/garden/projects/page.tsx
// Garden Projects Dashboard — lists all of the user's project workbenches.
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;
  type ProjectWithCount = Awaited<ReturnType<typeof prisma.project.findMany<{
    include: { _count: { select: { ideas: true; files: true } } }
  }>>>[number];

  const projects: ProjectWithCount[] = await prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { ideas: true, files: true } } },
  }) as ProjectWithCount[];

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-serif text-3xl text-ink">Projects</h1>
          <p className="text-ink-muted text-sm mt-1">
            Isolated workbenches for your focused research and writing.
          </p>
        </div>
        <Link href="/garden/projects/new" className="btn-primary">
          New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 text-ink-muted">
          <p className="text-lg mb-2">No projects yet.</p>
          <p className="text-sm">Create a project to organise your ideas and reference files.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: typeof projects[number]) => (
            <Link
              key={project.id}
              href={`/garden/projects/${project.id}`}
              className="group block bg-white border border-parchment-dark rounded-xl p-6 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <h2 className="font-serif text-lg text-ink group-hover:text-sage transition-colors mb-2 truncate">
                {project.name}
              </h2>
              {project.description && (
                <p className="text-ink-muted text-sm mb-4 line-clamp-2">{project.description}</p>
              )}
              <div className="flex gap-4 text-xs text-ink-muted">
                <span>{project._count.ideas} idea{project._count.ideas !== 1 ? "s" : ""}</span>
                <span>{project._count.files} file{project._count.files !== 1 ? "s" : ""}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
