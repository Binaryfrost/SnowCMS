import Model from '../../Model';

export class CollectionInputModelWithoutOrder extends Model {
  private id: string;
  private collectionId: string;
  private input: string;
  private name: string;
  private fieldName: string;
  private description: string;
  private required: boolean;
  private inputConfig: Record<string, any>;

  constructor(
    id: string,
    collectionId: string,
    input: string,
    name: string,
    fieldName: string,
    description: string,
    required: boolean,
    inputConfig: Record<string, any>,
  ) {
    super();
    this.id = id;
    this.collectionId = collectionId;
    this.input = input;
    this.name = name;
    this.fieldName = fieldName;
    this.description = description;
    this.required = required;
    this.inputConfig = inputConfig;
  }

  getId() {
    return this.id;
  }

  getCollectionId() {
    return this.collectionId;
  }

  getInput() {
    return this.input;
  }

  getName() {
    return this.name;
  }

  getFieldName() {
    return this.fieldName;
  }

  getDescription() {
    return this.description;
  }

  isRequired() {
    return this.required;
  }

  getInputConfig() {
    return this.inputConfig;
  }
}

export default class CollectionInputModel extends CollectionInputModelWithoutOrder {
  private order: number;

  constructor(
    id: string,
    collectionId: string,
    input: string,
    name: string,
    fieldName: string,
    description: string,
    required: boolean,
    inputConfig: Record<string, any>,
    order: number
  ) {
    super(id, collectionId, input, name, fieldName, description, required, inputConfig);
    this.order = order;
  }

  getOrder() {
    return this.order;
  }
}
