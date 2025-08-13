import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { 
  FileText, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users, 
  Building2,
  TrendingUp,
  AlertTriangle
} from "lucide-react"

interface AnalyticsCardsProps {
  metrics: {
    totalInvoices: number;
    totalAmount: number;
    totalOutstanding?: number;
    approved: number;
    approvedAmount?: number;
    paid: number;
    paidAmount?: number;
    repaid: number;
    repaidAmount?: number;
    rejected: number;
    rejectedAmount?: number;
    avgApprovalTime: string | number;
    overdue?: number;
    uniqueSuppliers?: number;
    totalSuppliers?: number;
    uniqueClients?: number;
    totalClients?: number;
    uniqueFinanciers?: number;
    totalFinanciers?: number;
    allUsers?: number;
    allOrgs?: number;
  };
  currencySymbol: string;
}

export function AnalyticsCards({ metrics, currencySymbol }: AnalyticsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalInvoices}</div>
          <p className="text-xs text-muted-foreground">
            {currencySymbol}{metrics.totalAmount?.toLocaleString?.()} total amount
          </p>
        </CardContent>
      </Card>

      {metrics.totalOutstanding !== undefined && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencySymbol}{metrics.totalOutstanding?.toLocaleString?.()}</div>
            <p className="text-xs text-muted-foreground">
              Pending approval
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Approved</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.approved}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.approvedAmount !== undefined && `${currencySymbol}${metrics.approvedAmount?.toLocaleString?.()} total`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Paid</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.paid}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.paidAmount !== undefined && `${currencySymbol}${metrics.paidAmount?.toLocaleString?.()} total`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Repaid</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.repaid}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.repaidAmount !== undefined && `${currencySymbol}${metrics.repaidAmount?.toLocaleString?.()} total`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          <XCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.rejected}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.rejectedAmount !== undefined && `${currencySymbol}${metrics.rejectedAmount?.toLocaleString?.()} total`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Approval Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.avgApprovalTime}</div>
          <p className="text-xs text-muted-foreground">
            days
          </p>
        </CardContent>
      </Card>

      {metrics.overdue !== undefined && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.overdue}</div>
            <p className="text-xs text-muted-foreground">
              invoices
            </p>
          </CardContent>
        </Card>
      )}

      {metrics.allUsers !== undefined && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.allUsers}</div>
            <p className="text-xs text-muted-foreground">
              registered users
            </p>
          </CardContent>
        </Card>
      )}

      {metrics.allOrgs !== undefined && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.allOrgs}</div>
            <p className="text-xs text-muted-foreground">
              total organizations
            </p>
          </CardContent>
        </Card>
      )}

      {(metrics.uniqueSuppliers !== undefined || metrics.totalSuppliers !== undefined) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.uniqueSuppliers ?? '-'} / {metrics.totalSuppliers ?? '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              active / total
            </p>
          </CardContent>
        </Card>
      )}

      {(metrics.uniqueClients !== undefined || metrics.totalClients !== undefined) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.uniqueClients ?? '-'} / {metrics.totalClients ?? '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              active / total
            </p>
          </CardContent>
        </Card>
      )}

      {(metrics.uniqueFinanciers !== undefined || metrics.totalFinanciers !== undefined) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Financiers</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.uniqueFinanciers ?? '-'} / {metrics.totalFinanciers ?? '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              active / total
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 