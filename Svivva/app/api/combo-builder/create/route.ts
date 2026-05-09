import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { projectRepository, versionRepository } from "@/lib/repositories";
import { db } from "@/lib/db";
import { projectBrands } from "@/lib/schema";
import { generateProjectSpec } from "@/lib/llm";
import { nanoid } from "nanoid";

interface APIToCreate {
  name: string;
  description: string;
  purpose: string;
}

interface BrandInfo {
  name: string;
  tagline?: string;
  colorScheme?: string[];
  logoDescription?: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bundleName, brand, apis, companyDescription, goals } = await request.json();

    if (!apis || apis.length === 0) {
      return NextResponse.json({ error: "At least one API is required" }, { status: 400 });
    }

    const createdProjects: { id: string; name: string; status: string }[] = [];

    // Create each API as a project
    for (const api of apis as APIToCreate[]) {
      // Generate a full prompt for this API
      const fullPrompt = `Create an API for: ${api.name}

Description: ${api.description}

Purpose: ${api.purpose}

Business Context: ${companyDescription}

Goals: ${goals || "Business efficiency"}

This API is part of the "${bundleName}" product suite.`;

      // Generate the project spec
      const specResult = await generateProjectSpec(fullPrompt, api.name);

      if (!specResult.success || !specResult.spec) {
        console.error(`Failed to generate spec for ${api.name}`);
        continue;
      }

      const spec = specResult.spec;

      // Create the project using repository
      const project = await projectRepository.create({
        ownerId: user.id,
        name: spec.name,
        slug: spec.slug,
        description: spec.description || `Part of ${bundleName} bundle`,
        systemPrompt: spec.systemPrompt,
        outputSchema: spec.endpoints[0]?.outputSchema || {},
        status: "draft",
      });

      // Create initial version
      await versionRepository.create({
        projectId: project.id,
        version: 1,
        systemPrompt: spec.systemPrompt,
        outputSchema: spec.endpoints[0]?.outputSchema || {},
        changeSummary: `Initial version created via Combo API Builder as part of "${bundleName}"`,
      });

      // Create brand if provided
      const brandInfo = brand as BrandInfo;
      if (brandInfo) {
        const colors = brandInfo.colorScheme || ["#5BA8A0", "#D782B2", "#6B3A67"];
        await db.insert(projectBrands).values({
          id: nanoid(),
          projectId: project.id,
          brandName: bundleName || brandInfo.name || api.name,
          tagline: brandInfo.tagline || null,
          colorPalette: {
            primary: colors[0] || "#5BA8A0",
            secondary: colors[1] || "#D782B2",
            accent: colors[2] || "#6B3A67",
          },
          category: "combo-bundle",
          personality: brandInfo.logoDescription || null,
        });
      }

      createdProjects.push({
        id: project.id,
        name: project.name,
        status: project.status,
      });
    }

    return NextResponse.json({
      success: true,
      bundleName,
      projectsCreated: createdProjects.length,
      projects: createdProjects,
    });
  } catch (error) {
    console.error("Combo builder create error:", error);
    return NextResponse.json({ error: "Failed to create API bundle" }, { status: 500 });
  }
}
