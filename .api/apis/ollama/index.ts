import type * as types from './types';
import type { ConfigOptions, FetchResponse } from 'api/dist/core'
import Oas from 'oas';
import APICore from 'api/dist/core';
import definition from './openapi.json';

class SDK {
  spec: Oas;
  core: APICore;

  constructor() {
    this.spec = Oas.init(definition);
    this.core = new APICore(this.spec, 'ollama/2.3.0 (api/6.1.2)');
  }

  /**
   * Optionally configure various options that the SDK allows.
   *
   * @param config Object of supported SDK options and toggles.
   * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
   * should be represented in milliseconds.
   */
  config(config: ConfigOptions) {
    this.core.setConfig(config);
  }

  /**
   * If the API you're using requires authentication you can supply the required credentials
   * through this method and the library will magically determine how they should be used
   * within your API request.
   *
   * With the exception of OpenID and MutualTLS, it supports all forms of authentication
   * supported by the OpenAPI specification.
   *
   * @example <caption>HTTP Basic auth</caption>
   * sdk.auth('username', 'password');
   *
   * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
   * sdk.auth('myBearerToken');
   *
   * @example <caption>API Keys</caption>
   * sdk.auth('myApiKey');
   *
   * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
   * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
   * @param values Your auth credentials for the API; can specify up to two strings or numbers.
   */
  auth(...values: string[] | number[]) {
    this.core.setAuth(...values);
    return this;
  }

  /**
   * If the API you're using offers alternate server URLs, and server variables, you can tell
   * the SDK which one to use with this method. To use it you can supply either one of the
   * server URLs that are contained within the OpenAPI definition (along with any server
   * variables), or you can pass it a fully qualified URL to use (that may or may not exist
   * within the OpenAPI definition).
   *
   * @example <caption>Server URL with server variables</caption>
   * sdk.server('https://{region}.api.example.com/{basePath}', {
   *   name: 'eu',
   *   basePath: 'v14',
   * });
   *
   * @example <caption>Fully qualified server URL</caption>
   * sdk.server('https://eu.api.example.com/v14');
   *
   * @param url Server URL
   * @param variables An object of variables to replace into the server URL.
   */
  server(url: string, variables = {}) {
    this.core.setServer(url, variables);
  }

  /**
   * Returns a list of assistants.
   *
   */
  listAssistants(metadata?: types.ListAssistantsMetadataParam): Promise<FetchResponse<200, types.ListAssistantsResponse200>> {
    return this.core.fetch('/assistants', 'get', metadata);
  }

  /**
   * Create an assistant with a model and instructions.
   *
   */
  createAssistant(body: types.CreateAssistantBodyParam): Promise<FetchResponse<200, types.CreateAssistantResponse200>> {
    return this.core.fetch('/assistants', 'post', body);
  }

  /**
   * Retrieves an assistant.
   *
   */
  getAssistant(metadata: types.GetAssistantMetadataParam): Promise<FetchResponse<200, types.GetAssistantResponse200>> {
    return this.core.fetch('/assistants/{assistant_id}', 'get', metadata);
  }

  /**
   * Modifies an assistant.
   *
   */
  modifyAssistant(body: types.ModifyAssistantBodyParam, metadata: types.ModifyAssistantMetadataParam): Promise<FetchResponse<200, types.ModifyAssistantResponse200>> {
    return this.core.fetch('/assistants/{assistant_id}', 'post', body, metadata);
  }

  /**
   * Delete an assistant.
   *
   */
  deleteAssistant(metadata: types.DeleteAssistantMetadataParam): Promise<FetchResponse<200, types.DeleteAssistantResponse200>> {
    return this.core.fetch('/assistants/{assistant_id}', 'delete', metadata);
  }

  /**
   * Generates audio from the input text.
   *
   */
  createSpeech(body: types.CreateSpeechBodyParam): Promise<FetchResponse<200, types.CreateSpeechResponse200>> {
    return this.core.fetch('/audio/speech', 'post', body);
  }

  /**
   * Transcribes audio into the input language.
   *
   */
  createTranscription(body: types.CreateTranscriptionBodyParam): Promise<FetchResponse<200, types.CreateTranscriptionResponse200>> {
    return this.core.fetch('/audio/transcriptions', 'post', body);
  }

  /**
   * Translates audio into English.
   *
   */
  createTranslation(body: types.CreateTranslationBodyParam): Promise<FetchResponse<200, types.CreateTranslationResponse200>> {
    return this.core.fetch('/audio/translations', 'post', body);
  }

  /**
   * Creates and executes a batch from an uploaded file of requests
   *
   */
  createBatch(body: types.CreateBatchBodyParam): Promise<FetchResponse<200, types.CreateBatchResponse200>> {
    return this.core.fetch('/batches', 'post', body);
  }

  /**
   * List your organization's batches.
   *
   */
  listBatches(metadata?: types.ListBatchesMetadataParam): Promise<FetchResponse<200, types.ListBatchesResponse200>> {
    return this.core.fetch('/batches', 'get', metadata);
  }

  /**
   * Retrieves a batch.
   *
   */
  retrieveBatch(metadata: types.RetrieveBatchMetadataParam): Promise<FetchResponse<200, types.RetrieveBatchResponse200>> {
    return this.core.fetch('/batches/{batch_id}', 'get', metadata);
  }

  /**
   * Cancels an in-progress batch. The batch will be in status `cancelling` for up to 10
   * minutes, before changing to `cancelled`, where it will have partial results (if any)
   * available in the output file.
   *
   */
  cancelBatch(metadata: types.CancelBatchMetadataParam): Promise<FetchResponse<200, types.CancelBatchResponse200>> {
    return this.core.fetch('/batches/{batch_id}/cancel', 'post', metadata);
  }

  /**
   * Creates a model response for the given chat conversation. Learn more in the
   * [text generation](/docs/guides/text-generation), [vision](/docs/guides/vision),
   * and [audio](/docs/guides/audio) guides.
   *
   * Parameter support can differ depending on the model used to generate the
   * response, particularly for newer reasoning models. Parameters that are only
   * supported for reasoning models are noted below. For the current state of 
   * unsupported parameters in reasoning models, 
   * [refer to the reasoning guide](/docs/guides/reasoning).
   *
   *
   */
  createChatCompletion(body: types.CreateChatCompletionBodyParam): Promise<FetchResponse<200, types.CreateChatCompletionResponse200>> {
    return this.core.fetch('/chat/completions', 'post', body);
  }

  /**
   * Creates a completion for the provided prompt and parameters.
   *
   */
  createCompletion(body: types.CreateCompletionBodyParam): Promise<FetchResponse<200, types.CreateCompletionResponse200>> {
    return this.core.fetch('/completions', 'post', body);
  }

  /**
   * Creates an embedding vector representing the input text.
   *
   */
  createEmbedding(body: types.CreateEmbeddingBodyParam): Promise<FetchResponse<200, types.CreateEmbeddingResponse200>> {
    return this.core.fetch('/embeddings', 'post', body);
  }

  /**
   * Returns a list of files.
   *
   */
  listFiles(metadata?: types.ListFilesMetadataParam): Promise<FetchResponse<200, types.ListFilesResponse200>> {
    return this.core.fetch('/files', 'get', metadata);
  }

  /**
   * Upload a file that can be used across various endpoints. Individual files can be up to
   * 512 MB, and the size of all files uploaded by one organization can be up to 100 GB.
   *
   * The Assistants API supports files up to 2 million tokens and of specific file types. See
   * the [Assistants Tools guide](/docs/assistants/tools) for details.
   *
   * The Fine-tuning API only supports `.jsonl` files. The input also has certain required
   * formats for fine-tuning [chat](/docs/api-reference/fine-tuning/chat-input) or
   * [completions](/docs/api-reference/fine-tuning/completions-input) models.
   *
   * The Batch API only supports `.jsonl` files up to 200 MB in size. The input also has a
   * specific required [format](/docs/api-reference/batch/request-input).
   *
   * Please [contact us](https://help.openai.com/) if you need to increase these storage
   * limits.
   *
   *
   */
  createFile(body: types.CreateFileBodyParam): Promise<FetchResponse<200, types.CreateFileResponse200>> {
    return this.core.fetch('/files', 'post', body);
  }

  /**
   * Delete a file.
   *
   */
  deleteFile(metadata: types.DeleteFileMetadataParam): Promise<FetchResponse<200, types.DeleteFileResponse200>> {
    return this.core.fetch('/files/{file_id}', 'delete', metadata);
  }

  /**
   * Returns information about a specific file.
   *
   */
  retrieveFile(metadata: types.RetrieveFileMetadataParam): Promise<FetchResponse<200, types.RetrieveFileResponse200>> {
    return this.core.fetch('/files/{file_id}', 'get', metadata);
  }

  /**
   * Returns the contents of the specified file.
   *
   */
  downloadFile(metadata: types.DownloadFileMetadataParam): Promise<FetchResponse<200, types.DownloadFileResponse200>> {
    return this.core.fetch('/files/{file_id}/content', 'get', metadata);
  }

  /**
   * Creates a fine-tuning job which begins the process of creating a new model from a given
   * dataset.
   *
   * Response includes details of the enqueued job including job status and the name of the
   * fine-tuned models once complete.
   *
   * [Learn more about fine-tuning](/docs/guides/fine-tuning)
   *
   *
   */
  createFineTuningJob(body: types.CreateFineTuningJobBodyParam): Promise<FetchResponse<200, types.CreateFineTuningJobResponse200>> {
    return this.core.fetch('/fine_tuning/jobs', 'post', body);
  }

  /**
   * List your organization's fine-tuning jobs
   *
   *
   */
  listPaginatedFineTuningJobs(metadata?: types.ListPaginatedFineTuningJobsMetadataParam): Promise<FetchResponse<200, types.ListPaginatedFineTuningJobsResponse200>> {
    return this.core.fetch('/fine_tuning/jobs', 'get', metadata);
  }

  /**
   * Get info about a fine-tuning job.
   *
   * [Learn more about fine-tuning](/docs/guides/fine-tuning)
   *
   *
   */
  retrieveFineTuningJob(metadata: types.RetrieveFineTuningJobMetadataParam): Promise<FetchResponse<200, types.RetrieveFineTuningJobResponse200>> {
    return this.core.fetch('/fine_tuning/jobs/{fine_tuning_job_id}', 'get', metadata);
  }

  /**
   * Immediately cancel a fine-tune job.
   *
   *
   */
  cancelFineTuningJob(metadata: types.CancelFineTuningJobMetadataParam): Promise<FetchResponse<200, types.CancelFineTuningJobResponse200>> {
    return this.core.fetch('/fine_tuning/jobs/{fine_tuning_job_id}/cancel', 'post', metadata);
  }

  /**
   * List checkpoints for a fine-tuning job.
   *
   *
   */
  listFineTuningJobCheckpoints(metadata: types.ListFineTuningJobCheckpointsMetadataParam): Promise<FetchResponse<200, types.ListFineTuningJobCheckpointsResponse200>> {
    return this.core.fetch('/fine_tuning/jobs/{fine_tuning_job_id}/checkpoints', 'get', metadata);
  }

  /**
   * Get status updates for a fine-tuning job.
   *
   *
   */
  listFineTuningEvents(metadata: types.ListFineTuningEventsMetadataParam): Promise<FetchResponse<200, types.ListFineTuningEventsResponse200>> {
    return this.core.fetch('/fine_tuning/jobs/{fine_tuning_job_id}/events', 'get', metadata);
  }

  /**
   * Creates an edited or extended image given an original image and a prompt.
   *
   */
  createImageEdit(body: types.CreateImageEditBodyParam): Promise<FetchResponse<200, types.CreateImageEditResponse200>> {
    return this.core.fetch('/images/edits', 'post', body);
  }

  /**
   * Creates an image given a prompt.
   *
   */
  createImage(body: types.CreateImageBodyParam): Promise<FetchResponse<200, types.CreateImageResponse200>> {
    return this.core.fetch('/images/generations', 'post', body);
  }

  /**
   * Creates a variation of a given image.
   *
   */
  createImageVariation(body: types.CreateImageVariationBodyParam): Promise<FetchResponse<200, types.CreateImageVariationResponse200>> {
    return this.core.fetch('/images/variations', 'post', body);
  }

  /**
   * Lists the currently available models, and provides basic information about each one such
   * as the owner and availability.
   *
   */
  listModels(): Promise<FetchResponse<200, types.ListModelsResponse200>> {
    return this.core.fetch('/models', 'get');
  }

  /**
   * Retrieves a model instance, providing basic information about the model such as the
   * owner and permissioning.
   *
   */
  retrieveModel(metadata: types.RetrieveModelMetadataParam): Promise<FetchResponse<200, types.RetrieveModelResponse200>> {
    return this.core.fetch('/models/{model}', 'get', metadata);
  }

  /**
   * Delete a fine-tuned model. You must have the Owner role in your organization to delete a
   * model.
   *
   */
  deleteModel(metadata: types.DeleteModelMetadataParam): Promise<FetchResponse<200, types.DeleteModelResponse200>> {
    return this.core.fetch('/models/{model}', 'delete', metadata);
  }

  /**
   * Classifies if text and/or image inputs are potentially harmful. Learn
   * more in the [moderation guide](/docs/guides/moderation).
   *
   *
   */
  createModeration(body: types.CreateModerationBodyParam): Promise<FetchResponse<200, types.CreateModerationResponse200>> {
    return this.core.fetch('/moderations', 'post', body);
  }

  /**
   * Retrieve a paginated list of organization admin API keys.
   *
   * @summary List organization API keys
   */
  adminApiKeysList(metadata?: types.AdminApiKeysListMetadataParam): Promise<FetchResponse<200, types.AdminApiKeysListResponse200>> {
    return this.core.fetch('/organization/admin_api_keys', 'get', metadata);
  }

  /**
   * Create a new admin-level API key for the organization.
   *
   * @summary Create an organization admin API key
   */
  adminApiKeysCreate(body: types.AdminApiKeysCreateBodyParam): Promise<FetchResponse<200, types.AdminApiKeysCreateResponse200>> {
    return this.core.fetch('/organization/admin_api_keys', 'post', body);
  }

  /**
   * Get details for a specific organization API key by its ID.
   *
   * @summary Retrieve a single organization API key
   */
  adminApiKeysGet(metadata: types.AdminApiKeysGetMetadataParam): Promise<FetchResponse<200, types.AdminApiKeysGetResponse200>> {
    return this.core.fetch('/organization/admin_api_keys/{key_id}', 'get', metadata);
  }

  /**
   * Delete the specified admin API key.
   *
   * @summary Delete an organization admin API key
   */
  adminApiKeysDelete(metadata: types.AdminApiKeysDeleteMetadataParam): Promise<FetchResponse<200, types.AdminApiKeysDeleteResponse200>> {
    return this.core.fetch('/organization/admin_api_keys/{key_id}', 'delete', metadata);
  }

  /**
   * List user actions and configuration changes within this organization.
   *
   */
  listAuditLogs(metadata?: types.ListAuditLogsMetadataParam): Promise<FetchResponse<200, types.ListAuditLogsResponse200>> {
    return this.core.fetch('/organization/audit_logs', 'get', metadata);
  }

  /**
   * Get costs details for the organization.
   *
   */
  usageCosts(metadata: types.UsageCostsMetadataParam): Promise<FetchResponse<200, types.UsageCostsResponse200>> {
    return this.core.fetch('/organization/costs', 'get', metadata);
  }

  /**
   * Returns a list of invites in the organization.
   *
   */
  listInvites(metadata?: types.ListInvitesMetadataParam): Promise<FetchResponse<200, types.ListInvitesResponse200>> {
    return this.core.fetch('/organization/invites', 'get', metadata);
  }

  /**
   * Create an invite for a user to the organization. The invite must be accepted by the user
   * before they have access to the organization.
   *
   */
  inviteUser(body: types.InviteUserBodyParam): Promise<FetchResponse<200, types.InviteUserResponse200>> {
    return this.core.fetch('/organization/invites', 'post', body);
  }

  /**
   * Retrieves an invite.
   *
   */
  retrieveInvite(metadata: types.RetrieveInviteMetadataParam): Promise<FetchResponse<200, types.RetrieveInviteResponse200>> {
    return this.core.fetch('/organization/invites/{invite_id}', 'get', metadata);
  }

  /**
   * Delete an invite. If the invite has already been accepted, it cannot be deleted.
   *
   */
  deleteInvite(metadata: types.DeleteInviteMetadataParam): Promise<FetchResponse<200, types.DeleteInviteResponse200>> {
    return this.core.fetch('/organization/invites/{invite_id}', 'delete', metadata);
  }

  /**
   * Returns a list of projects.
   *
   */
  listProjects(metadata?: types.ListProjectsMetadataParam): Promise<FetchResponse<200, types.ListProjectsResponse200>> {
    return this.core.fetch('/organization/projects', 'get', metadata);
  }

  /**
   * Create a new project in the organization. Projects can be created and archived, but
   * cannot be deleted.
   *
   */
  createProject(body: types.CreateProjectBodyParam): Promise<FetchResponse<200, types.CreateProjectResponse200>> {
    return this.core.fetch('/organization/projects', 'post', body);
  }

  /**
   * Retrieves a project.
   *
   */
  retrieveProject(metadata: types.RetrieveProjectMetadataParam): Promise<FetchResponse<200, types.RetrieveProjectResponse200>> {
    return this.core.fetch('/organization/projects/{project_id}', 'get', metadata);
  }

  /**
   * Modifies a project in the organization.
   *
   * @throws FetchError<400, types.ModifyProjectResponse400> Error response when updating the default project.
   */
  modifyProject(body: types.ModifyProjectBodyParam, metadata: types.ModifyProjectMetadataParam): Promise<FetchResponse<200, types.ModifyProjectResponse200>> {
    return this.core.fetch('/organization/projects/{project_id}', 'post', body, metadata);
  }

  /**
   * Returns a list of API keys in the project.
   *
   */
  listProjectApiKeys(metadata: types.ListProjectApiKeysMetadataParam): Promise<FetchResponse<200, types.ListProjectApiKeysResponse200>> {
    return this.core.fetch('/organization/projects/{project_id}/api_keys', 'get', metadata);
  }

  /**
   * Retrieves an API key in the project.
   *
   */
  retrieveProjectApiKey(metadata: types.RetrieveProjectApiKeyMetadataParam): Promise<FetchResponse<200, types.RetrieveProjectApiKeyResponse200>> {
    return this.core.fetch('/organization/projects/{project_id}/api_keys/{key_id}', 'get', metadata);
  }

  /**
   * Deletes an API key from the project.
   *
   * @throws FetchError<400, types.DeleteProjectApiKeyResponse400> Error response for various conditions.
   */
  deleteProjectApiKey(metadata: types.DeleteProjectApiKeyMetadataParam): Promise<FetchResponse<200, types.DeleteProjectApiKeyResponse200>> {
    return this.core.fetch('/organization/projects/{project_id}/api_keys/{key_id}', 'delete', metadata);
  }

  /**
   * Archives a project in the organization. Archived projects cannot be used or updated.
   *
   */
  archiveProject(metadata: types.ArchiveProjectMetadataParam): Promise<FetchResponse<200, types.ArchiveProjectResponse200>> {
    return this.core.fetch('/organization/projects/{project_id}/archive', 'post', metadata);
  }

  /**
   * Returns the rate limits per model for a project.
   *
   */
  listProjectRateLimits(metadata: types.ListProjectRateLimitsMetadataParam): Promise<FetchResponse<200, types.ListProjectRateLimitsResponse200>> {
    return this.core.fetch('/organization/projects/{project_id}/rate_limits', 'get', metadata);
  }

  /**
   * Updates a project rate limit.
   *
   * @throws FetchError<400, types.UpdateProjectRateLimitsResponse400> Error response for various conditions.
   */
  updateProjectRateLimits(body: types.UpdateProjectRateLimitsBodyParam, metadata: types.UpdateProjectRateLimitsMetadataParam): Promise<FetchResponse<200, types.UpdateProjectRateLimitsResponse200>> {
    return this.core.fetch('/organization/projects/{project_id}/rate_limits/{rate_limit_id}', 'post', body, metadata);
  }

  /**
   * Returns a list of service accounts in the project.
   *
   * @throws FetchError<400, types.ListProjectServiceAccountsResponse400> Error response when project is archived.
   */
  listProjectServiceAccounts(metadata: types.ListProjectServiceAccountsMetadataParam): Promise<FetchResponse<200, types.ListProjectServiceAccountsResponse200>> {
    return this.core.fetch('/organization/projects/{project_id}/service_accounts', 'get', metadata);
  }

  /**
   * Creates a new service account in the project. This also returns an unredacted API key
   * for the service account.
   *
   * @throws FetchError<400, types.CreateProjectServiceAccountResponse400> Error response when project is archived.
   */
  createProjectServiceAccount(body: types.CreateProjectServiceAccountBodyParam, metadata: types.CreateProjectServiceAccountMetadataParam): Promise<FetchResponse<200, types.CreateProjectServiceAccountResponse200>> {
    return this.core.fetch('/organization/projects/{project_id}/service_accounts', 'post', body, metadata);
  }

  /**
   * Retrieves a service account in the project.
   *
   */
  retrieveProjectServiceAccount(metadata: types.RetrieveProjectServiceAccountMetadataParam): Promise<FetchResponse<200, types.RetrieveProjectServiceAccountResponse200>> {
    return this.core.fetch('/organization/projects/{project_id}/service_accounts/{service_account_id}', 'get', metadata);
  }

  /**
   * Deletes a service account from the project.
   *
   */
  deleteProjectServiceAccount(metadata: types.DeleteProjectServiceAccountMetadataParam): Promise<FetchResponse<200, types.DeleteProjectServiceAccountResponse200>> {
    return this.core.fetch('/organization/projects/{project_id}/service_accounts/{service_account_id}', 'delete', metadata);
  }

  /**
   * Returns a list of users in the project.
   *
   * @throws FetchError<400, types.ListProjectUsersResponse400> Error response when project is archived.
   */
  listProjectUsers(metadata: types.ListProjectUsersMetadataParam): Promise<FetchResponse<200, types.ListProjectUsersResponse200>> {
    return this.core.fetch('/organization/projects/{project_id}/users', 'get', metadata);
  }

  /**
   * Adds a user to the project. Users must already be members of the organization to be
   * added to a project.
   *
   * @throws FetchError<400, types.CreateProjectUserResponse400> Error response for various conditions.
   */
  createProjectUser(body: types.CreateProjectUserBodyParam, metadata: types.CreateProjectUserMetadataParam): Promise<FetchResponse<200, types.CreateProjectUserResponse200>> {
    return this.core.fetch('/organization/projects/{project_id}/users', 'post', body, metadata);
  }

  /**
   * Retrieves a user in the project.
   *
   */
  retrieveProjectUser(metadata: types.RetrieveProjectUserMetadataParam): Promise<FetchResponse<200, types.RetrieveProjectUserResponse200>> {
    return this.core.fetch('/organization/projects/{project_id}/users/{user_id}', 'get', metadata);
  }

  /**
   * Modifies a user's role in the project.
   *
   * @throws FetchError<400, types.ModifyProjectUserResponse400> Error response for various conditions.
   */
  modifyProjectUser(body: types.ModifyProjectUserBodyParam, metadata: types.ModifyProjectUserMetadataParam): Promise<FetchResponse<200, types.ModifyProjectUserResponse200>> {
    return this.core.fetch('/organization/projects/{project_id}/users/{user_id}', 'post', body, metadata);
  }

  /**
   * Deletes a user from the project.
   *
   * @throws FetchError<400, types.DeleteProjectUserResponse400> Error response for various conditions.
   */
  deleteProjectUser(metadata: types.DeleteProjectUserMetadataParam): Promise<FetchResponse<200, types.DeleteProjectUserResponse200>> {
    return this.core.fetch('/organization/projects/{project_id}/users/{user_id}', 'delete', metadata);
  }

  /**
   * Get audio speeches usage details for the organization.
   *
   */
  usageAudioSpeeches(metadata: types.UsageAudioSpeechesMetadataParam): Promise<FetchResponse<200, types.UsageAudioSpeechesResponse200>> {
    return this.core.fetch('/organization/usage/audio_speeches', 'get', metadata);
  }

  /**
   * Get audio transcriptions usage details for the organization.
   *
   */
  usageAudioTranscriptions(metadata: types.UsageAudioTranscriptionsMetadataParam): Promise<FetchResponse<200, types.UsageAudioTranscriptionsResponse200>> {
    return this.core.fetch('/organization/usage/audio_transcriptions', 'get', metadata);
  }

  /**
   * Get code interpreter sessions usage details for the organization.
   *
   */
  usageCodeInterpreterSessions(metadata: types.UsageCodeInterpreterSessionsMetadataParam): Promise<FetchResponse<200, types.UsageCodeInterpreterSessionsResponse200>> {
    return this.core.fetch('/organization/usage/code_interpreter_sessions', 'get', metadata);
  }

  /**
   * Get completions usage details for the organization.
   *
   */
  usageCompletions(metadata: types.UsageCompletionsMetadataParam): Promise<FetchResponse<200, types.UsageCompletionsResponse200>> {
    return this.core.fetch('/organization/usage/completions', 'get', metadata);
  }

  /**
   * Get embeddings usage details for the organization.
   *
   */
  usageEmbeddings(metadata: types.UsageEmbeddingsMetadataParam): Promise<FetchResponse<200, types.UsageEmbeddingsResponse200>> {
    return this.core.fetch('/organization/usage/embeddings', 'get', metadata);
  }

  /**
   * Get images usage details for the organization.
   *
   */
  usageImages(metadata: types.UsageImagesMetadataParam): Promise<FetchResponse<200, types.UsageImagesResponse200>> {
    return this.core.fetch('/organization/usage/images', 'get', metadata);
  }

  /**
   * Get moderations usage details for the organization.
   *
   */
  usageModerations(metadata: types.UsageModerationsMetadataParam): Promise<FetchResponse<200, types.UsageModerationsResponse200>> {
    return this.core.fetch('/organization/usage/moderations', 'get', metadata);
  }

  /**
   * Get vector stores usage details for the organization.
   *
   */
  usageVectorStores(metadata: types.UsageVectorStoresMetadataParam): Promise<FetchResponse<200, types.UsageVectorStoresResponse200>> {
    return this.core.fetch('/organization/usage/vector_stores', 'get', metadata);
  }

  /**
   * Lists all of the users in the organization.
   *
   */
  listUsers(metadata?: types.ListUsersMetadataParam): Promise<FetchResponse<200, types.ListUsersResponse200>> {
    return this.core.fetch('/organization/users', 'get', metadata);
  }

  /**
   * Retrieves a user by their identifier.
   *
   */
  retrieveUser(metadata: types.RetrieveUserMetadataParam): Promise<FetchResponse<200, types.RetrieveUserResponse200>> {
    return this.core.fetch('/organization/users/{user_id}', 'get', metadata);
  }

  /**
   * Modifies a user's role in the organization.
   *
   */
  modifyUser(body: types.ModifyUserBodyParam, metadata: types.ModifyUserMetadataParam): Promise<FetchResponse<200, types.ModifyUserResponse200>> {
    return this.core.fetch('/organization/users/{user_id}', 'post', body, metadata);
  }

  /**
   * Deletes a user from the organization.
   *
   */
  deleteUser(metadata: types.DeleteUserMetadataParam): Promise<FetchResponse<200, types.DeleteUserResponse200>> {
    return this.core.fetch('/organization/users/{user_id}', 'delete', metadata);
  }

  /**
   * Create an ephemeral API token for use in client-side applications with the
   * Realtime API. Can be configured with the same session parameters as the
   * `session.update` client event.
   *
   * It responds with a session object, plus a `client_secret` key which contains
   * a usable ephemeral API token that can be used to authenticate browser clients
   * for the Realtime API.
   *
   *
   */
  createRealtimeSession(body: types.CreateRealtimeSessionBodyParam): Promise<FetchResponse<200, types.CreateRealtimeSessionResponse200>> {
    return this.core.fetch('/realtime/sessions', 'post', body);
  }

  /**
   * Create a thread.
   *
   */
  createThread(body?: types.CreateThreadBodyParam): Promise<FetchResponse<200, types.CreateThreadResponse200>> {
    return this.core.fetch('/threads', 'post', body);
  }

  /**
   * Create a thread and run it in one request.
   *
   */
  createThreadAndRun(body: types.CreateThreadAndRunBodyParam): Promise<FetchResponse<200, types.CreateThreadAndRunResponse200>> {
    return this.core.fetch('/threads/runs', 'post', body);
  }

  /**
   * Retrieves a thread.
   *
   */
  getThread(metadata: types.GetThreadMetadataParam): Promise<FetchResponse<200, types.GetThreadResponse200>> {
    return this.core.fetch('/threads/{thread_id}', 'get', metadata);
  }

  /**
   * Modifies a thread.
   *
   */
  modifyThread(body: types.ModifyThreadBodyParam, metadata: types.ModifyThreadMetadataParam): Promise<FetchResponse<200, types.ModifyThreadResponse200>> {
    return this.core.fetch('/threads/{thread_id}', 'post', body, metadata);
  }

  /**
   * Delete a thread.
   *
   */
  deleteThread(metadata: types.DeleteThreadMetadataParam): Promise<FetchResponse<200, types.DeleteThreadResponse200>> {
    return this.core.fetch('/threads/{thread_id}', 'delete', metadata);
  }

  /**
   * Returns a list of messages for a given thread.
   *
   */
  listMessages(metadata: types.ListMessagesMetadataParam): Promise<FetchResponse<200, types.ListMessagesResponse200>> {
    return this.core.fetch('/threads/{thread_id}/messages', 'get', metadata);
  }

  /**
   * Create a message.
   *
   */
  createMessage(body: types.CreateMessageBodyParam, metadata: types.CreateMessageMetadataParam): Promise<FetchResponse<200, types.CreateMessageResponse200>> {
    return this.core.fetch('/threads/{thread_id}/messages', 'post', body, metadata);
  }

  /**
   * Retrieve a message.
   *
   */
  getMessage(metadata: types.GetMessageMetadataParam): Promise<FetchResponse<200, types.GetMessageResponse200>> {
    return this.core.fetch('/threads/{thread_id}/messages/{message_id}', 'get', metadata);
  }

  /**
   * Modifies a message.
   *
   */
  modifyMessage(body: types.ModifyMessageBodyParam, metadata: types.ModifyMessageMetadataParam): Promise<FetchResponse<200, types.ModifyMessageResponse200>> {
    return this.core.fetch('/threads/{thread_id}/messages/{message_id}', 'post', body, metadata);
  }

  /**
   * Deletes a message.
   *
   */
  deleteMessage(metadata: types.DeleteMessageMetadataParam): Promise<FetchResponse<200, types.DeleteMessageResponse200>> {
    return this.core.fetch('/threads/{thread_id}/messages/{message_id}', 'delete', metadata);
  }

  /**
   * Returns a list of runs belonging to a thread.
   *
   */
  listRuns(metadata: types.ListRunsMetadataParam): Promise<FetchResponse<200, types.ListRunsResponse200>> {
    return this.core.fetch('/threads/{thread_id}/runs', 'get', metadata);
  }

  /**
   * Create a run.
   *
   */
  createRun(body: types.CreateRunBodyParam, metadata: types.CreateRunMetadataParam): Promise<FetchResponse<200, types.CreateRunResponse200>> {
    return this.core.fetch('/threads/{thread_id}/runs', 'post', body, metadata);
  }

  /**
   * Retrieves a run.
   *
   */
  getRun(metadata: types.GetRunMetadataParam): Promise<FetchResponse<200, types.GetRunResponse200>> {
    return this.core.fetch('/threads/{thread_id}/runs/{run_id}', 'get', metadata);
  }

  /**
   * Modifies a run.
   *
   */
  modifyRun(body: types.ModifyRunBodyParam, metadata: types.ModifyRunMetadataParam): Promise<FetchResponse<200, types.ModifyRunResponse200>> {
    return this.core.fetch('/threads/{thread_id}/runs/{run_id}', 'post', body, metadata);
  }

  /**
   * Cancels a run that is `in_progress`.
   *
   */
  cancelRun(metadata: types.CancelRunMetadataParam): Promise<FetchResponse<200, types.CancelRunResponse200>> {
    return this.core.fetch('/threads/{thread_id}/runs/{run_id}/cancel', 'post', metadata);
  }

  /**
   * Returns a list of run steps belonging to a run.
   *
   */
  listRunSteps(metadata: types.ListRunStepsMetadataParam): Promise<FetchResponse<200, types.ListRunStepsResponse200>> {
    return this.core.fetch('/threads/{thread_id}/runs/{run_id}/steps', 'get', metadata);
  }

  /**
   * Retrieves a run step.
   *
   */
  getRunStep(metadata: types.GetRunStepMetadataParam): Promise<FetchResponse<200, types.GetRunStepResponse200>> {
    return this.core.fetch('/threads/{thread_id}/runs/{run_id}/steps/{step_id}', 'get', metadata);
  }

  /**
   * When a run has the `status: "requires_action"` and `required_action.type` is
   * `submit_tool_outputs`, this endpoint can be used to submit the outputs from the tool
   * calls once they're all completed. All outputs must be submitted in a single request.
   *
   *
   */
  submitToolOuputsToRun(body: types.SubmitToolOuputsToRunBodyParam, metadata: types.SubmitToolOuputsToRunMetadataParam): Promise<FetchResponse<200, types.SubmitToolOuputsToRunResponse200>> {
    return this.core.fetch('/threads/{thread_id}/runs/{run_id}/submit_tool_outputs', 'post', body, metadata);
  }

  /**
   * Creates an intermediate [Upload](/docs/api-reference/uploads/object) object that you can
   * add [Parts](/docs/api-reference/uploads/part-object) to. Currently, an Upload can accept
   * at most 8 GB in total and expires after an hour after you create it.
   *
   * Once you complete the Upload, we will create a [File](/docs/api-reference/files/object)
   * object that contains all the parts you uploaded. This File is usable in the rest of our
   * platform as a regular File object.
   *
   * For certain `purpose`s, the correct `mime_type` must be specified. Please refer to
   * documentation for the supported MIME types for your use case:
   * - [Assistants](/docs/assistants/tools/file-search#supported-files)
   *
   * For guidance on the proper filename extensions for each purpose, please follow the
   * documentation on [creating a File](/docs/api-reference/files/create).
   *
   *
   */
  createUpload(body: types.CreateUploadBodyParam): Promise<FetchResponse<200, types.CreateUploadResponse200>> {
    return this.core.fetch('/uploads', 'post', body);
  }

  /**
   * Cancels the Upload. No Parts may be added after an Upload is cancelled.
   *
   *
   */
  cancelUpload(metadata: types.CancelUploadMetadataParam): Promise<FetchResponse<200, types.CancelUploadResponse200>> {
    return this.core.fetch('/uploads/{upload_id}/cancel', 'post', metadata);
  }

  /**
   * Completes the [Upload](/docs/api-reference/uploads/object). 
   *
   * Within the returned Upload object, there is a nested
   * [File](/docs/api-reference/files/object) object that is ready to use in the rest of the
   * platform.
   *
   * You can specify the order of the Parts by passing in an ordered list of the Part IDs.
   *
   * The number of bytes uploaded upon completion must match the number of bytes initially
   * specified when creating the Upload object. No Parts may be added after an Upload is
   * completed.
   *
   *
   */
  completeUpload(body: types.CompleteUploadBodyParam, metadata: types.CompleteUploadMetadataParam): Promise<FetchResponse<200, types.CompleteUploadResponse200>> {
    return this.core.fetch('/uploads/{upload_id}/complete', 'post', body, metadata);
  }

  /**
   * Adds a [Part](/docs/api-reference/uploads/part-object) to an
   * [Upload](/docs/api-reference/uploads/object) object. A Part represents a chunk of bytes
   * from the file you are trying to upload. 
   *
   * Each Part can be at most 64 MB, and you can add Parts until you hit the Upload maximum
   * of 8 GB.
   *
   * It is possible to add multiple Parts in parallel. You can decide the intended order of
   * the Parts when you [complete the Upload](/docs/api-reference/uploads/complete).
   *
   *
   */
  addUploadPart(body: types.AddUploadPartBodyParam, metadata: types.AddUploadPartMetadataParam): Promise<FetchResponse<200, types.AddUploadPartResponse200>> {
    return this.core.fetch('/uploads/{upload_id}/parts', 'post', body, metadata);
  }

  /**
   * Returns a list of vector stores.
   *
   */
  listVectorStores(metadata?: types.ListVectorStoresMetadataParam): Promise<FetchResponse<200, types.ListVectorStoresResponse200>> {
    return this.core.fetch('/vector_stores', 'get', metadata);
  }

  /**
   * Create a vector store.
   *
   */
  createVectorStore(body: types.CreateVectorStoreBodyParam): Promise<FetchResponse<200, types.CreateVectorStoreResponse200>> {
    return this.core.fetch('/vector_stores', 'post', body);
  }

  /**
   * Retrieves a vector store.
   *
   */
  getVectorStore(metadata: types.GetVectorStoreMetadataParam): Promise<FetchResponse<200, types.GetVectorStoreResponse200>> {
    return this.core.fetch('/vector_stores/{vector_store_id}', 'get', metadata);
  }

  /**
   * Modifies a vector store.
   *
   */
  modifyVectorStore(body: types.ModifyVectorStoreBodyParam, metadata: types.ModifyVectorStoreMetadataParam): Promise<FetchResponse<200, types.ModifyVectorStoreResponse200>> {
    return this.core.fetch('/vector_stores/{vector_store_id}', 'post', body, metadata);
  }

  /**
   * Delete a vector store.
   *
   */
  deleteVectorStore(metadata: types.DeleteVectorStoreMetadataParam): Promise<FetchResponse<200, types.DeleteVectorStoreResponse200>> {
    return this.core.fetch('/vector_stores/{vector_store_id}', 'delete', metadata);
  }

  /**
   * Create a vector store file batch.
   *
   */
  createVectorStoreFileBatch(body: types.CreateVectorStoreFileBatchBodyParam, metadata: types.CreateVectorStoreFileBatchMetadataParam): Promise<FetchResponse<200, types.CreateVectorStoreFileBatchResponse200>> {
    return this.core.fetch('/vector_stores/{vector_store_id}/file_batches', 'post', body, metadata);
  }

  /**
   * Retrieves a vector store file batch.
   *
   */
  getVectorStoreFileBatch(metadata: types.GetVectorStoreFileBatchMetadataParam): Promise<FetchResponse<200, types.GetVectorStoreFileBatchResponse200>> {
    return this.core.fetch('/vector_stores/{vector_store_id}/file_batches/{batch_id}', 'get', metadata);
  }

  /**
   * Cancel a vector store file batch. This attempts to cancel the processing of files in
   * this batch as soon as possible.
   *
   */
  cancelVectorStoreFileBatch(metadata: types.CancelVectorStoreFileBatchMetadataParam): Promise<FetchResponse<200, types.CancelVectorStoreFileBatchResponse200>> {
    return this.core.fetch('/vector_stores/{vector_store_id}/file_batches/{batch_id}/cancel', 'post', metadata);
  }

  /**
   * Returns a list of vector store files in a batch.
   *
   */
  listFilesInVectorStoreBatch(metadata: types.ListFilesInVectorStoreBatchMetadataParam): Promise<FetchResponse<200, types.ListFilesInVectorStoreBatchResponse200>> {
    return this.core.fetch('/vector_stores/{vector_store_id}/file_batches/{batch_id}/files', 'get', metadata);
  }

  /**
   * Returns a list of vector store files.
   *
   */
  listVectorStoreFiles(metadata: types.ListVectorStoreFilesMetadataParam): Promise<FetchResponse<200, types.ListVectorStoreFilesResponse200>> {
    return this.core.fetch('/vector_stores/{vector_store_id}/files', 'get', metadata);
  }

  /**
   * Create a vector store file by attaching a [File](/docs/api-reference/files) to a [vector
   * store](/docs/api-reference/vector-stores/object).
   *
   */
  createVectorStoreFile(body: types.CreateVectorStoreFileBodyParam, metadata: types.CreateVectorStoreFileMetadataParam): Promise<FetchResponse<200, types.CreateVectorStoreFileResponse200>> {
    return this.core.fetch('/vector_stores/{vector_store_id}/files', 'post', body, metadata);
  }

  /**
   * Retrieves a vector store file.
   *
   */
  getVectorStoreFile(metadata: types.GetVectorStoreFileMetadataParam): Promise<FetchResponse<200, types.GetVectorStoreFileResponse200>> {
    return this.core.fetch('/vector_stores/{vector_store_id}/files/{file_id}', 'get', metadata);
  }

  /**
   * Delete a vector store file. This will remove the file from the vector store but the file
   * itself will not be deleted. To delete the file, use the [delete
   * file](/docs/api-reference/files/delete) endpoint.
   *
   */
  deleteVectorStoreFile(metadata: types.DeleteVectorStoreFileMetadataParam): Promise<FetchResponse<200, types.DeleteVectorStoreFileResponse200>> {
    return this.core.fetch('/vector_stores/{vector_store_id}/files/{file_id}', 'delete', metadata);
  }
}

const createSDK = (() => { return new SDK(); })()
;

export default createSDK;

export type { AddUploadPartBodyParam, AddUploadPartMetadataParam, AddUploadPartResponse200, AdminApiKeysCreateBodyParam, AdminApiKeysCreateResponse200, AdminApiKeysDeleteMetadataParam, AdminApiKeysDeleteResponse200, AdminApiKeysGetMetadataParam, AdminApiKeysGetResponse200, AdminApiKeysListMetadataParam, AdminApiKeysListResponse200, ArchiveProjectMetadataParam, ArchiveProjectResponse200, CancelBatchMetadataParam, CancelBatchResponse200, CancelFineTuningJobMetadataParam, CancelFineTuningJobResponse200, CancelRunMetadataParam, CancelRunResponse200, CancelUploadMetadataParam, CancelUploadResponse200, CancelVectorStoreFileBatchMetadataParam, CancelVectorStoreFileBatchResponse200, CompleteUploadBodyParam, CompleteUploadMetadataParam, CompleteUploadResponse200, CreateAssistantBodyParam, CreateAssistantResponse200, CreateBatchBodyParam, CreateBatchResponse200, CreateChatCompletionBodyParam, CreateChatCompletionResponse200, CreateCompletionBodyParam, CreateCompletionResponse200, CreateEmbeddingBodyParam, CreateEmbeddingResponse200, CreateFileBodyParam, CreateFileResponse200, CreateFineTuningJobBodyParam, CreateFineTuningJobResponse200, CreateImageBodyParam, CreateImageEditBodyParam, CreateImageEditResponse200, CreateImageResponse200, CreateImageVariationBodyParam, CreateImageVariationResponse200, CreateMessageBodyParam, CreateMessageMetadataParam, CreateMessageResponse200, CreateModerationBodyParam, CreateModerationResponse200, CreateProjectBodyParam, CreateProjectResponse200, CreateProjectServiceAccountBodyParam, CreateProjectServiceAccountMetadataParam, CreateProjectServiceAccountResponse200, CreateProjectServiceAccountResponse400, CreateProjectUserBodyParam, CreateProjectUserMetadataParam, CreateProjectUserResponse200, CreateProjectUserResponse400, CreateRealtimeSessionBodyParam, CreateRealtimeSessionResponse200, CreateRunBodyParam, CreateRunMetadataParam, CreateRunResponse200, CreateSpeechBodyParam, CreateSpeechResponse200, CreateThreadAndRunBodyParam, CreateThreadAndRunResponse200, CreateThreadBodyParam, CreateThreadResponse200, CreateTranscriptionBodyParam, CreateTranscriptionResponse200, CreateTranslationBodyParam, CreateTranslationResponse200, CreateUploadBodyParam, CreateUploadResponse200, CreateVectorStoreBodyParam, CreateVectorStoreFileBatchBodyParam, CreateVectorStoreFileBatchMetadataParam, CreateVectorStoreFileBatchResponse200, CreateVectorStoreFileBodyParam, CreateVectorStoreFileMetadataParam, CreateVectorStoreFileResponse200, CreateVectorStoreResponse200, DeleteAssistantMetadataParam, DeleteAssistantResponse200, DeleteFileMetadataParam, DeleteFileResponse200, DeleteInviteMetadataParam, DeleteInviteResponse200, DeleteMessageMetadataParam, DeleteMessageResponse200, DeleteModelMetadataParam, DeleteModelResponse200, DeleteProjectApiKeyMetadataParam, DeleteProjectApiKeyResponse200, DeleteProjectApiKeyResponse400, DeleteProjectServiceAccountMetadataParam, DeleteProjectServiceAccountResponse200, DeleteProjectUserMetadataParam, DeleteProjectUserResponse200, DeleteProjectUserResponse400, DeleteThreadMetadataParam, DeleteThreadResponse200, DeleteUserMetadataParam, DeleteUserResponse200, DeleteVectorStoreFileMetadataParam, DeleteVectorStoreFileResponse200, DeleteVectorStoreMetadataParam, DeleteVectorStoreResponse200, DownloadFileMetadataParam, DownloadFileResponse200, GetAssistantMetadataParam, GetAssistantResponse200, GetMessageMetadataParam, GetMessageResponse200, GetRunMetadataParam, GetRunResponse200, GetRunStepMetadataParam, GetRunStepResponse200, GetThreadMetadataParam, GetThreadResponse200, GetVectorStoreFileBatchMetadataParam, GetVectorStoreFileBatchResponse200, GetVectorStoreFileMetadataParam, GetVectorStoreFileResponse200, GetVectorStoreMetadataParam, GetVectorStoreResponse200, InviteUserBodyParam, InviteUserResponse200, ListAssistantsMetadataParam, ListAssistantsResponse200, ListAuditLogsMetadataParam, ListAuditLogsResponse200, ListBatchesMetadataParam, ListBatchesResponse200, ListFilesInVectorStoreBatchMetadataParam, ListFilesInVectorStoreBatchResponse200, ListFilesMetadataParam, ListFilesResponse200, ListFineTuningEventsMetadataParam, ListFineTuningEventsResponse200, ListFineTuningJobCheckpointsMetadataParam, ListFineTuningJobCheckpointsResponse200, ListInvitesMetadataParam, ListInvitesResponse200, ListMessagesMetadataParam, ListMessagesResponse200, ListModelsResponse200, ListPaginatedFineTuningJobsMetadataParam, ListPaginatedFineTuningJobsResponse200, ListProjectApiKeysMetadataParam, ListProjectApiKeysResponse200, ListProjectRateLimitsMetadataParam, ListProjectRateLimitsResponse200, ListProjectServiceAccountsMetadataParam, ListProjectServiceAccountsResponse200, ListProjectServiceAccountsResponse400, ListProjectUsersMetadataParam, ListProjectUsersResponse200, ListProjectUsersResponse400, ListProjectsMetadataParam, ListProjectsResponse200, ListRunStepsMetadataParam, ListRunStepsResponse200, ListRunsMetadataParam, ListRunsResponse200, ListUsersMetadataParam, ListUsersResponse200, ListVectorStoreFilesMetadataParam, ListVectorStoreFilesResponse200, ListVectorStoresMetadataParam, ListVectorStoresResponse200, ModifyAssistantBodyParam, ModifyAssistantMetadataParam, ModifyAssistantResponse200, ModifyMessageBodyParam, ModifyMessageMetadataParam, ModifyMessageResponse200, ModifyProjectBodyParam, ModifyProjectMetadataParam, ModifyProjectResponse200, ModifyProjectResponse400, ModifyProjectUserBodyParam, ModifyProjectUserMetadataParam, ModifyProjectUserResponse200, ModifyProjectUserResponse400, ModifyRunBodyParam, ModifyRunMetadataParam, ModifyRunResponse200, ModifyThreadBodyParam, ModifyThreadMetadataParam, ModifyThreadResponse200, ModifyUserBodyParam, ModifyUserMetadataParam, ModifyUserResponse200, ModifyVectorStoreBodyParam, ModifyVectorStoreMetadataParam, ModifyVectorStoreResponse200, RetrieveBatchMetadataParam, RetrieveBatchResponse200, RetrieveFileMetadataParam, RetrieveFileResponse200, RetrieveFineTuningJobMetadataParam, RetrieveFineTuningJobResponse200, RetrieveInviteMetadataParam, RetrieveInviteResponse200, RetrieveModelMetadataParam, RetrieveModelResponse200, RetrieveProjectApiKeyMetadataParam, RetrieveProjectApiKeyResponse200, RetrieveProjectMetadataParam, RetrieveProjectResponse200, RetrieveProjectServiceAccountMetadataParam, RetrieveProjectServiceAccountResponse200, RetrieveProjectUserMetadataParam, RetrieveProjectUserResponse200, RetrieveUserMetadataParam, RetrieveUserResponse200, SubmitToolOuputsToRunBodyParam, SubmitToolOuputsToRunMetadataParam, SubmitToolOuputsToRunResponse200, UpdateProjectRateLimitsBodyParam, UpdateProjectRateLimitsMetadataParam, UpdateProjectRateLimitsResponse200, UpdateProjectRateLimitsResponse400, UsageAudioSpeechesMetadataParam, UsageAudioSpeechesResponse200, UsageAudioTranscriptionsMetadataParam, UsageAudioTranscriptionsResponse200, UsageCodeInterpreterSessionsMetadataParam, UsageCodeInterpreterSessionsResponse200, UsageCompletionsMetadataParam, UsageCompletionsResponse200, UsageCostsMetadataParam, UsageCostsResponse200, UsageEmbeddingsMetadataParam, UsageEmbeddingsResponse200, UsageImagesMetadataParam, UsageImagesResponse200, UsageModerationsMetadataParam, UsageModerationsResponse200, UsageVectorStoresMetadataParam, UsageVectorStoresResponse200 } from './types';
