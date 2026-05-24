"use client";

import * as React from "react";
import Giscus from "@giscus/react";
import { useTheme } from "next-themes";

interface Props {
  slug: string;
}

export function GiscusComments({ slug }: Props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const repo = process.env.NEXT_PUBLIC_GISCUS_REPO;
  const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
  const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
  const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;

  if (!repo || !repoId || !category || !categoryId) return null;
  if (!mounted) return null;

  return (
    <section className="mt-12">
      <h2 className="mb-4 text-lg font-semibold">Bình luận</h2>
      <Giscus
        id="comments"
        repo={repo as `${string}/${string}`}
        repoId={repoId}
        category={category}
        categoryId={categoryId}
        mapping="specific"
        term={slug}
        strict="1"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="bottom"
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        lang="vi"
        loading="lazy"
      />
    </section>
  );
}
