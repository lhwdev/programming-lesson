import { Block } from "../blocks/defaultBlocks";
import { BlockSchema, InlineContentSchema, StyleSchema } from "../schema";

export type Selection<
  BSchema extends BlockSchema,
  I extends InlineContentSchema,
  S extends StyleSchema,
> = {
  blocks: Block<BSchema, I, S>[];
};
