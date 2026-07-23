import type { Knex } from 'knex';
import NotFoundError from '../../../../common/errors/base/NotFoundError';
import Repository from '../../Repository';
import CollectionInputModel from './CollectionInputModel';

export interface CollectionInputTable {
  id: string
  collectionId: string
  input: string
  name: string
  fieldName: string
  description: string
  required: boolean
  inputConfig: Record<string, any>
  order: number
}

export default class CollectionInputRepository extends Repository {
  constructor(db: Knex) {
    super(db, 'collection_inputs');
  }

  async getAllCollectionInputs(collectionId: string) {
    const results = await this.db<CollectionInputTable>(this.table)
      .select(
        'id',
        'collectionId',
        'name',
        'description',
        'fieldName',
        'input',
        'inputConfig',
        'required',
        'order'
      )
      .where('collectionId', collectionId)
      .orderBy('order', 'asc');

    return results.map((result) => new CollectionInputModel(
      result.id,
      result.collectionId,
      result.input,
      result.name,
      result.fieldName,
      result.description,
      result.required,
      result.inputConfig,
      result.order
    ));
  }

  async getCollectionInput(id: string) {
    const result = await this.db<CollectionInputTable>(this.table)
      .select(
        'id',
        'collectionId',
        'name',
        'description',
        'fieldName',
        'input',
        'inputConfig',
        'required',
        'order'
      )
      .where({
        id
      })
      .orderBy('order', 'asc')
      .first();

    if (!result) {
      throw new NotFoundError('Collection Input not found');
    }

    return new CollectionInputModel(
      result.id,
      result.collectionId,
      result.input,
      result.name,
      result.fieldName,
      result.description,
      result.required,
      result.inputConfig,
      result.order
    );
  }

  async create(input: CollectionInputModel) {
    await this.db<CollectionInputTable>(this.table)
      .insert({
        id: input.getId(),
        collectionId: input.getCollectionId(),
        name: input.getName(),
        description: input.getDescription(),
        fieldName: input.getFieldName(),
        input: input.getInput(),
        inputConfig: input.getInputConfig(),
        required: input.isRequired(),
        order: input.getOrder()
      });
  }

  async update(input: CollectionInputModel) {
    if (!(await this.exists(input.getId()))) {
      throw new NotFoundError('Collection Input not found');
    }

    // Order intentionally excluded from update. Use reorder() method instead.
    const updateData: Partial<CollectionInputTable> = {
      name: input.getName(),
      description: input.getDescription(),
      fieldName: input.getFieldName(),
      input: input.getInput(),
      inputConfig: input.getInputConfig(),
      required: input.isRequired()
    };

    await this.db<CollectionInputTable>(this.table)
      .where({
        id: input.getId()
      })
      .update(updateData);
  }

  async reorder(inputId: string, collectionId: string, newPosition: number) {
    const oldPositionResult = await this.db<CollectionInputTable>(this.table)
      .select('order')
      .where({
        id: inputId
      })
      .first();

    if (!oldPositionResult) {
      throw new NotFoundError('Collection Input not found');
    }

    const oldPosition = oldPositionResult.order;

    if (newPosition === oldPosition) return;

    if (newPosition > oldPosition) {
      await this.db<CollectionInputTable>()
        .table(this.table)
        .decrement('order', 1)
        .where({
          collectionId
        })
        .andWhere('order', '>', oldPosition)
        .andWhere('order', '<=', newPosition);
    } else {
      await this.db<CollectionInputTable>()
        .table(this.table)
        .increment('order', 1)
        .where({
          collectionId
        })
        .andWhere('order', '>=', newPosition)
        .andWhere('order', '<=', oldPosition);
    }

    await this.db<CollectionInputTable>()
      .table(this.table)
      .update({
        order: newPosition
      })
      .where({
        id: inputId
      });
  }

  // TODO: IMPORTANT: DO NOT CONFIGURE COLLECTION INPUTS ONDELETE CASCADE
  /**
   * Deletes a Collection Input and reorders remaining Collection Inputs
   * consecutively. The calling method should first unset the Collection
   * title and/or slug if referencing the deleted Collection Input.
   * @param id Input ID
   * @param collectionId Collection ID
   */
  async delete(id: string, collectionId: string) {
    /*
     * TODO: Implement
     *
     * If input is used as slug or title, unset these to ensure that
     * cascade doesn't delete the collection. After deleting input,
     * reorder remaining inputs.
     *
     * This should be done by the service, not here.
     */

    const input = await this.getCollectionInput(id);

    await this.db<CollectionInputTable>('collection_inputs')
      .decrement('order', 1)
      .where({
        collectionId
      })
      .andWhere('order', '>', input.getOrder());

    await this.db<CollectionInputTable>(this.table)
      .where({
        id
      })
      .delete();
  }
}
