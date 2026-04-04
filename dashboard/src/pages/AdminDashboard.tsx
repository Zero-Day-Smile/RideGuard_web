import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
	ArrowLeft,
	Activity,
	BellRing,
	Calculator,
	CloudRain,
	RefreshCw,
	Settings,
	Shield,
	Users,
	Wallet,
	Waves,
	BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
	fetchAdminAuditLogs,
	fetchAdminOverview,
	fetchAdminUsers,
	fetchStrategy,
	refreshTriggers,
	retrainMlModels,
	type AdminAuditLogItem,
	type StrategyResponse,
} from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { toast } from "sonner";

const AdminDashboard = () => {
	const user = getCurrentUser();
	const [loading, setLoading] = useState(true);
	const [retraining, setRetraining] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [auditLogs, setAuditLogs] = useState<AdminAuditLogItem[]>([]);
	const [usersCount, setUsersCount] = useState(0);
	const [strategy, setStrategy] = useState<StrategyResponse | null>(null);
	const [overview, setOverview] = useState({
		activePolicies: 0,
		payoutsToday: 0,
		fraudAlerts: 0,
		avgPayoutTimeMin: 0,
	});

	useEffect(() => {
		let active = true;

		async function load() {
			try {
				const [overviewRes, auditsRes, usersRes, strategyRes] = await Promise.all([
					fetchAdminOverview(),
					fetchAdminAuditLogs(6),
					fetchAdminUsers(),
					fetchStrategy(),
				]);
				if (!active) return;

				setOverview({
					activePolicies: overviewRes.weeklyMetrics.activePolicies || 0,
					payoutsToday: overviewRes.weeklyMetrics.payoutsToday || 0,
					fraudAlerts: overviewRes.weeklyMetrics.fraudAlerts || 0,
					avgPayoutTimeMin: overviewRes.weeklyMetrics.avgPayoutTimeMin || 0,
				});
				setAuditLogs(auditsRes.logs || []);
				setUsersCount(usersRes.users.length || 0);
				setStrategy(strategyRes);
			} catch {
				if (!active) return;
				toast.error("Could not load admin console");
			} finally {
				if (active) setLoading(false);
			}
		}

		void load();
		return () => {
			active = false;
		};
	}, []);

	async function handleRefreshSignals() {
		setRefreshing(true);
		try {
			await refreshTriggers();
			toast.success("Signals refreshed");
		} catch {
			toast.error("Refresh failed");
		} finally {
			setRefreshing(false);
		}
	}

	async function handleRetrainModel() {
		setRetraining(true);
		try {
			const res = await retrainMlModels();
			setStrategy(res);
			toast.success("Model retrained");
		} catch {
			toast.error("Retrain failed");
		} finally {
			setRetraining(false);
		}
	}

	const bcrText = useMemo(() => {
		if (!strategy) return "--";
		return strategy.actuarial.bcr.toFixed(2);
	}, [strategy]);

	return (
		<div className="min-h-screen bg-background">
			<header className="border-b border-border bg-card sticky top-0 z-30">
				<div className="container mx-auto px-4 h-16 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Link to="/admin/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
							<ArrowLeft className="w-5 h-5" />
						</Link>
						<div>
							<p className="text-xs uppercase tracking-widest text-primary font-semibold">Admin Console</p>
							<h1 className="font-display text-xl font-bold text-foreground">RideGuard Operations</h1>
							<p className="text-xs text-muted-foreground mt-0.5">Underwriting, pricing, triggers, actuarial controls, and settlement in one console.</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<span className="hidden sm:inline-flex rounded-full px-2.5 py-1 text-xs font-semibold bg-primary/15 text-primary">
							{user?.fullName || "Admin"}
						</span>
						<Link to="/manage-users"><Button variant="outline" size="sm" className="gap-2"><Users className="w-4 h-4" />Users</Button></Link>
						<Link to="/settings"><Button variant="outline" size="sm" className="gap-2"><Settings className="w-4 h-4" />Settings</Button></Link>
					</div>
				</div>
			</header>

			<main className="container mx-auto px-4 py-8 max-w-7xl">
				<ScrollReveal>
					<div className="mb-6 rounded-3xl border border-border/50 bg-gradient-to-br from-primary/8 via-card to-secondary/30 p-6 shadow-card">
						<div className="flex flex-wrap items-center gap-2 mb-3">
							<span className="rounded-full bg-primary/15 text-primary px-3 py-1 text-xs font-semibold">Live portfolio</span>
							<span className="rounded-full bg-foreground/5 text-foreground px-3 py-1 text-xs font-semibold">Model version: {strategy?.pricing.modelVersion || "--"}</span>
							<span className="rounded-full bg-foreground/5 text-foreground px-3 py-1 text-xs font-semibold">Users: {usersCount}</span>
						</div>
						<h2 className="font-display text-2xl md:text-3xl font-bold text-foreground tracking-tight">Operational control for every role, every risk signal, every payout.</h2>
						<p className="text-sm text-muted-foreground max-w-3xl mt-2">This console is built for the admin to manage the full lifecycle: onboard riders, adjust policies, retrain pricing, refresh public triggers, and inspect settlement outcomes.</p>
					</div>

					<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
						<MetricCard icon={Shield} label="Coverage Live" value={overview.activePolicies.toString()} subtitle="Active policies" />
						<MetricCard icon={Wallet} label="Payouts Today" value={overview.payoutsToday.toString()} subtitle="Automated settlements" />
						<MetricCard icon={BellRing} label="Fraud Watch" value={overview.fraudAlerts.toString()} subtitle="Cases in review" />
						<MetricCard icon={Activity} label="Payout SLA" value={`${overview.avgPayoutTimeMin.toFixed(1)}m`} subtitle="Average fulfillment" />
					</div>
				</ScrollReveal>

				<ScrollReveal>
					<section className="bg-card border border-border/50 rounded-2xl p-5 shadow-card mb-8">
						<div className="flex items-center justify-between gap-3 mb-4">
							<div>
								<h2 className="font-display text-lg font-semibold text-foreground">Strategy Snapshot</h2>
								<p className="text-sm text-muted-foreground">Underwriting, triggers, pricing, actuarial controls, and settlement channels, all in one live control plane.</p>
							</div>
							<div className="flex gap-2">
								<Button variant="outline" onClick={handleRefreshSignals} disabled={refreshing} className="gap-2">
									<CloudRain className="w-4 h-4" />{refreshing ? "Refreshing..." : "Refresh Signals"}
								</Button>
								<Button variant="hero" onClick={handleRetrainModel} disabled={retraining} className="gap-2">
									<RefreshCw className="w-4 h-4" />{retraining ? "Retraining..." : "Retrain Pricing"}
								</Button>
							</div>
						</div>

						{loading && <p className="text-sm text-muted-foreground">Loading strategy...</p>}
						{!loading && strategy && (
							<div className="space-y-4">
								<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
									<MetricCard icon={Shield} label="Active Policies" value={String(strategy.metrics.activePolicies)} subtitle="ML portfolio" />
									<MetricCard icon={Users} label="Policy Count" value={String(strategy.metrics.policyCount)} subtitle="Enrolled users" />
									<MetricCard icon={Wallet} label="Weekly Premium" value={`Rs ${strategy.metrics.weeklyPremiumCollected}`} subtitle="Collected" />
									<MetricCard icon={BellRing} label="Claims Paid" value={`Rs ${strategy.metrics.totalClaimsPaid}`} subtitle="Settled payouts" />
									<MetricCard icon={BadgeCheck} label="Current BCR" value={strategy.metrics.bcr.toFixed(2)} subtitle={strategy.metrics.enrollmentState} />
								</div>

								<div className="grid md:grid-cols-2 gap-4">
								<AdminStrategyCard icon={Users} title={strategy.underwriting.title} items={strategy.underwriting.rules} footer={strategy.underwriting.disclosure} />
								<AdminStrategyCard icon={Waves} title={strategy.triggers.title} items={strategy.triggers.rules} footer={strategy.triggers.disclosure} />
								<AdminStrategyCard icon={Calculator} title={strategy.pricing.title} items={[strategy.pricing.baseFormula, ...strategy.pricing.adjustments]} footer={`Target range ${strategy.pricing.targetRange} • model ${strategy.pricing.modelVersion}`} />
								<AdminStrategyCard icon={BadgeCheck} title={strategy.actuarial.title} items={[
									`BCR ${bcrText} against target ${strategy.actuarial.targetBcrLower}-${strategy.actuarial.targetBcrUpper}`,
									`Loss ratio ${(strategy.actuarial.lossRatio * 100).toFixed(0)}% • enrollment ${strategy.actuarial.enrollmentState}`,
									strategy.actuarial.stressScenario,
								]} footer={`Loss ratio cap ${(strategy.actuarial.lossRatioLimit * 100).toFixed(0)}%`} />
								<div className="md:col-span-2">
									<AdminStrategyCard icon={Wallet} title={strategy.settlement.title} items={[
										...strategy.settlement.steps.map((step, index) => `${index + 1}. ${step}`),
										`Channels: ${strategy.settlement.channels.join(" / ")}`,
										...strategy.settlement.keyPoints,
									]} footer="Zero-touch payouts with rollback and audit logging." />
								</div>
								</div>
							</div>
						)}
					</section>
				</ScrollReveal>

				<div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
					<ScrollReveal>
						<section className="bg-card border border-border/50 rounded-2xl p-5 shadow-card">
							<h2 className="font-display text-lg font-semibold text-foreground mb-4">Portfolio Controls</h2>
							<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
								<ControlCard title="Manage Users" caption="Create riders or admins, reset passwords, and change roles." to="/manage-users" />
								<ControlCard title="Policy Management" caption="Adjust coverage, deductibles, and status for riders." to="/policy-management" />
								<ControlCard title="Premium Lab" caption="Test pricing inputs and see the weekly premium response." to="/premium-lab" />
								<ControlCard title="Claims Console" caption="Review fraud scores and zero-touch claim outcomes." to="/claims" />
								<ControlCard title="Fraud Center" caption="Review and investigate fraud alerts by city and severity." to="/admin/fraud-center" />
								<ControlCard title="Trigger Ops" caption="Monitor live trigger feed and simulate disruptions." to="/admin/trigger-ops" />
								<ControlCard title="Claims Ops" caption="Work queue for pending, approved, paid, and failed claims." to="/admin/claims-ops" />
								<ControlCard title="Model Ops" caption="Inspect model snapshot, drift indicators, and retrain." to="/admin/model-ops" />
								<ControlCard title="Audit Logs" caption="Immutable logs with filters and CSV export." to="/admin/audit-logs" />
							</div>
						</section>
					</ScrollReveal>

					<ScrollReveal delay={80}>
						<section className="bg-card border border-border/50 rounded-2xl p-5 shadow-card">
							<h2 className="font-display text-lg font-semibold text-foreground mb-4">Recent Admin Activity</h2>
							{auditLogs.length === 0 ? (
								<p className="text-sm text-muted-foreground">No recent audit logs.</p>
							) : (
								<div className="space-y-3">
									{auditLogs.map((log) => (
										<div key={log.id} className="rounded-xl border border-border/50 p-3">
											<div className="flex items-center justify-between gap-2 mb-1">
												<span className="text-xs font-semibold uppercase tracking-wide text-primary">{log.action.replaceAll("_", " ")}</span>
												<span className="text-xs text-muted-foreground">{log.createdAt}</span>
											</div>
											<p className="text-xs text-muted-foreground">{log.targetType}:{log.targetId}</p>
											<p className="text-xs text-foreground mt-1">{log.details}</p>
										</div>
									))}
								</div>
							)}
							<div className="mt-4 rounded-xl border border-border/50 p-3 bg-background/70 text-sm text-muted-foreground">
								Users in system: <span className="text-foreground font-semibold">{usersCount}</span>
							</div>
						</section>
					</ScrollReveal>
				</div>
			</main>
		</div>
	);
};

const MetricCard = ({ icon: Icon, label, value, subtitle }: { icon: any; label: string; value: string; subtitle: string }) => (
	<div className="rounded-2xl border border-border/50 bg-card shadow-card p-5">
		<Icon className="w-5 h-5 text-primary mb-3" />
		<p className="text-xs text-muted-foreground">{label}</p>
		<p className="font-display font-bold text-2xl text-foreground mt-1">{value}</p>
		<p className="text-xs text-primary/70 mt-1">{subtitle}</p>
	</div>
);

const AdminStrategyCard = ({
	icon: Icon,
	title,
	items,
	footer,
}: {
	icon: any;
	title: string;
	items: string[];
	footer: string;
}) => (
	<div className="rounded-2xl border border-border/50 bg-background/80 p-5">
		<div className="flex items-center gap-3 mb-3">
			<div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
				<Icon className="w-5 h-5 text-primary-foreground" />
			</div>
			<div>
				<p className="font-display font-semibold text-foreground">{title}</p>
				<p className="text-xs text-muted-foreground">Operational guidance</p>
			</div>
		</div>
		<ul className="space-y-2 text-sm text-muted-foreground leading-relaxed">
			{items.map((item) => (
				<li key={item} className="flex items-start gap-2">
					<span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
					<span>{item}</span>
				</li>
			))}
		</ul>
		<p className="text-xs text-primary/70 mt-4">{footer}</p>
	</div>
);

const ControlCard = ({ title, caption, to }: { title: string; caption: string; to: string }) => (
	<Link to={to} className="rounded-xl border border-border/50 p-4 hover:border-primary/40 transition-colors bg-background/50">
		<p className="text-sm font-semibold text-foreground">{title}</p>
		<p className="text-xs text-muted-foreground mt-1">{caption}</p>
	</Link>
);

export default AdminDashboard;
