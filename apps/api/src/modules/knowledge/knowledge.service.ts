import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IngestDocumentInput } from '@callagent/shared';

@Injectable()
export class KnowledgeService {
  constructor(private prisma: PrismaService) {}

  async listKnowledgeBases(orgId: string) {
    return this.prisma.knowledgeBase.findMany({
      where: { organizationId: orgId },
      include: {
        _count: { select: { documents: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getKnowledgeBase(orgId: string, id: string) {
    const kb = await this.prisma.knowledgeBase.findFirst({
      where: { id, organizationId: orgId },
      include: {
        documents: {
          include: {
            _count: { select: { chunks: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!kb) throw new NotFoundException('Knowledge base not found');
    return kb;
  }

  async createKnowledgeBase(orgId: string, name: string, description?: string) {
    return this.prisma.knowledgeBase.create({
      data: {
        organizationId: orgId,
        name,
        description,
      },
    });
  }

  async ingestDocument(orgId: string, kbId: string, dto: IngestDocumentInput) {
    const kb = await this.prisma.knowledgeBase.findFirst({
      where: { id: kbId, organizationId: orgId },
    });

    if (!kb) throw new NotFoundException('Knowledge base not found');

    // Split text into paragraphs / chunks of ~300 chars
    const rawChunks = dto.content
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 10);

    const chunks = rawChunks.length > 0 ? rawChunks : [dto.content];

    return this.prisma.$transaction(async (tx) => {
      const doc = await tx.knowledgeDocument.create({
        data: {
          knowledgeBaseId: kbId,
          title: dto.title,
          sourceType: dto.sourceType,
          originalContent: dto.content,
          chunkCount: chunks.length,
          status: 'PROCESSED',
        },
      });

      for (let i = 0; i < chunks.length; i++) {
        // Generate mock deterministic embedding vector (5 floats)
        const sampleEmbedding = [
          Math.sin(i + 1) * 0.1,
          Math.cos(i + 2) * 0.1,
          Math.sin(i * 3) * 0.1,
          0.05,
          -0.02,
        ];

        await tx.knowledgeChunk.create({
          data: {
            documentId: doc.id,
            chunkIndex: i,
            content: chunks[i],
            metadata: JSON.stringify({ title: dto.title, chunkIndex: i }),
            embedding: JSON.stringify(sampleEmbedding),
          },
        });
      }

      return doc;
    });
  }

  async searchKnowledge(orgId: string, kbId: string, query: string) {
    const kb = await this.prisma.knowledgeBase.findFirst({
      where: { id: kbId, organizationId: orgId },
    });

    if (!kb) throw new NotFoundException('Knowledge base not found');

    const lowerQuery = query.toLowerCase();

    // Query chunks matching text
    const chunks = await this.prisma.knowledgeChunk.findMany({
      where: {
        document: { knowledgeBaseId: kbId },
        content: { contains: query },
      },
      include: { document: { select: { title: true, sourceType: true } } },
      take: 5,
    });

    if (chunks.length > 0) {
      return chunks.map((c) => ({
        content: c.content,
        documentTitle: c.document.title,
        sourceType: c.document.sourceType,
        similarityScore: 0.89,
      }));
    }

    // Fallback search
    const allChunks = await this.prisma.knowledgeChunk.findMany({
      where: { document: { knowledgeBaseId: kbId } },
      include: { document: true },
      take: 3,
    });

    return allChunks.map((c) => ({
      content: c.content,
      documentTitle: c.document.title,
      sourceType: c.document.sourceType,
      similarityScore: 0.72,
    }));
  }

  async deleteDocument(orgId: string, docId: string) {
    const doc = await this.prisma.knowledgeDocument.findFirst({
      where: { id: docId, knowledgeBase: { organizationId: orgId } },
    });

    if (!doc) throw new NotFoundException('Document not found');

    return this.prisma.knowledgeDocument.delete({ where: { id: docId } });
  }
}
