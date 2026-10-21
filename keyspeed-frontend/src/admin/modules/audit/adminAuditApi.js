import { baseApi } from '../../../app/baseApi';

export const adminAuditApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.set('page', params.page);
        if (params.limit) searchParams.set('limit', params.limit);
        if (params.adminId) searchParams.set('adminId', params.adminId);
        if (params.action && params.action !== 'all') searchParams.set('action', params.action);
        if (params.targetType && params.targetType !== 'all') searchParams.set('targetType', params.targetType);
        if (params.startDate) searchParams.set('startDate', params.startDate);
        if (params.endDate) searchParams.set('endDate', params.endDate);
        return `/admin/audit?${searchParams.toString()}`;
      },
      providesTags: ['AdminAudit'],
    }),
  }),
});

export const { useGetAuditLogsQuery } = adminAuditApi;

