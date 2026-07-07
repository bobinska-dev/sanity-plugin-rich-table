// Common Sanity ID Component Patterns
// These examples show typical usage patterns for Sanity ID components

import { Button } from "@sanity/sanity-id/components/button"
import { Card } from "@sanity/sanity-id/components/card"
import { Input } from "@sanity/sanity-id/components/input"
import { Select } from "@sanity/sanity-id/components/select"
import { Checkbox } from "@sanity/sanity-id/components/checkbox"
import { Badge } from "@sanity/sanity-id/components/badge"
import { Eyebrow } from "@sanity/sanity-id/components/eyebrow"
import { IconButton } from "@sanity/sanity-id/components/icon-button"
import { LinkCTA } from "@sanity/sanity-id/components/link-cta"
import { AvatarStack } from "@sanity/sanity-id/components/avatar-stack"
import { Table } from "@sanity/sanity-id/components/table"
import { CodeBlock } from "@sanity/sanity-id/components/code-block"
import { Breadcrumbs } from "@sanity/sanity-id/components/breadcrumbs"
import { RadioSwitch } from "@sanity/sanity-id/components/radio-switch"

// ============================================
// Hero Section with CTA
// ============================================
export function HeroSection() {
	return (
		<section className="py-24 text-center">
			<Eyebrow>Introducing Sanity Studio v3</Eyebrow>
			<h1 className="text-page-heading-xl mt-4">
				The Content Operating System
			</h1>
			<p className="text-body-lg mt-6 max-w-2xl mx-auto">
				Sanity is the platform for structured content that lets you build better
				digital experiences.
			</p>
			<div className="flex gap-4 justify-center mt-8">
				<Button mode="primary" size="lg">
					Get Started
				</Button>
				<Button mode="outline" size="lg">
					View Demo
				</Button>
			</div>
		</section>
	)
}

// ============================================
// Feature Cards Grid
// ============================================
export function FeatureCards() {
	const features = [
		{
			title: "Real-time Collaboration",
			description: "Work together with your team in real-time on content.",
			icon: "users" as const,
		},
		{
			title: "Flexible Content Models",
			description: "Define your content structure with powerful schemas.",
			icon: "database" as const,
		},
		{
			title: "Instant APIs",
			description: "Get APIs instantly as you define your content models.",
			icon: "api" as const,
		},
	]

	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
			{features.map((feature) => (
				<Card key={feature.title} mode="outline">
					<div className="space-y-4">
						<Badge icon={feature.icon}>{feature.title}</Badge>
						<p className="text-body">{feature.description}</p>
						<LinkCTA href="#">Learn more</LinkCTA>
					</div>
				</Card>
			))}
		</div>
	)
}

// ============================================
// Contact Form
// ============================================
export function ContactForm() {
	return (
		<form className="max-w-md space-y-6">
			<Input id="name" label="Full Name" placeholder="John Doe" required />

			<Input
				id="email"
				type="email"
				label="Email Address"
				placeholder="john@example.com"
				hint="We'll never share your email with anyone."
				required
			/>

			<Select id="company-size" label="Company Size" required>
				<option value="">Select size</option>
				<option value="1-10">1-10 employees</option>
				<option value="11-50">11-50 employees</option>
				<option value="51-200">51-200 employees</option>
				<option value="201+">201+ employees</option>
			</Select>

			<Checkbox id="newsletter" label="Subscribe to our newsletter" />

			<div className="flex gap-3">
				<Button type="submit" mode="primary">
					Submit
				</Button>
				<Button type="button" mode="ghost">
					Cancel
				</Button>
			</div>
		</form>
	)
}

// ============================================
// Data Table with Actions
// ============================================
export function DataTable() {
	const data = [
		{ id: 1, name: "Document 1", status: "published", author: "Alice" },
		{ id: 2, name: "Document 2", status: "draft", author: "Bob" },
		{ id: 3, name: "Document 3", status: "review", author: "Charlie" },
	]

	return (
		<Table>
			<thead>
				<tr>
					<th>Name</th>
					<th>Status</th>
					<th>Author</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{data.map((row) => (
					<tr key={row.id}>
						<td>{row.name}</td>
						<td>
							<Badge size="sm">{row.status}</Badge>
						</td>
						<td>{row.author}</td>
						<td>
							<div className="flex gap-2">
								<IconButton
									icon="edit"
									size="sm"
									mode="ghost"
									aria-label="Edit"
								/>
								<IconButton
									icon="trash"
									size="sm"
									mode="ghost"
									aria-label="Delete"
								/>
							</div>
						</td>
					</tr>
				))}
			</tbody>
		</Table>
	)
}

// ============================================
// Settings Panel
// ============================================
export function SettingsPanel() {
	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-section-heading mb-4">Display Settings</h3>
				<RadioSwitch
					name="theme"
					options={[
						{ label: "Light", value: "light" },
						{ label: "Dark", value: "dark" },
						{ label: "System", value: "system" },
					]}
					defaultValue="system"
				/>
			</div>

			<div>
				<h3 className="text-section-heading mb-4">View Options</h3>
				<RadioSwitch
					name="view"
					options={[
						{ label: "Grid", value: "grid" },
						{ label: "List", value: "list" },
						{ label: "Table", value: "table" },
					]}
					defaultValue="grid"
				/>
			</div>

			<div className="pt-4 border-t border-border-dim">
				<Button mode="primary">Save Settings</Button>
			</div>
		</div>
	)
}

// ============================================
// Navigation Header
// ============================================
export function NavigationHeader() {
	return (
		<header className="border-b border-border-dim">
			<div className="container mx-auto px-4 py-4">
				<Breadcrumbs
					items={[
						{ href: "/", label: "Home" },
						{ href: "/projects", label: "Projects" },
						{ href: "/projects/website", label: "Website Redesign" },
						{ label: "Settings" },
					]}
				/>
			</div>
		</header>
	)
}

// ============================================
// Team Members Display
// ============================================
export function TeamMembers() {
	const members = [
		{ name: "Alice Johnson", image: "/alice.jpg" },
		{ name: "Bob Smith", image: "/bob.jpg" },
		{ name: "Charlie Brown", image: "/charlie.jpg" },
		{ name: "Diana Prince", image: "/diana.jpg" },
		{ name: "Eve Wilson", image: "/eve.jpg" },
	]

	return (
		<div className="flex items-center gap-4">
			<span className="text-body">Team Members:</span>
			<AvatarStack avatars={members} max={4} size="sm" />
		</div>
	)
}

// ============================================
// Code Example Display
// ============================================
export function CodeExample() {
	const exampleCode = `
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: 'your-project-id',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2024-01-01',
})

// Fetch all posts
const posts = await client.fetch('*[_type == "post"]')
  `.trim()

	return (
		<div className="space-y-4">
			<h3 className="text-section-heading">Quick Start</h3>
			<CodeBlock
				language="typescript"
				filename="client.ts"
				code={exampleCode}
			/>
		</div>
	)
}

// ============================================
// Status Cards
// ============================================
export function StatusCards() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
			<Card size="sm">
				<div className="space-y-2">
					<p className="text-body-sm text-fg-dim">Total Documents</p>
					<p className="text-page-heading">1,234</p>
					<Badge size="sm" icon="trending-up">
						+12%
					</Badge>
				</div>
			</Card>
			<Card size="sm">
				<div className="space-y-2">
					<p className="text-body-sm text-fg-dim">Published</p>
					<p className="text-page-heading">892</p>
					<Badge size="sm" icon="check">
						Active
					</Badge>
				</div>
			</Card>
			<Card size="sm">
				<div className="space-y-2">
					<p className="text-body-sm text-fg-dim">Drafts</p>
					<p className="text-page-heading">342</p>
					<Badge size="sm" icon="edit">
						In Progress
					</Badge>
				</div>
			</Card>
			<Card size="sm">
				<div className="space-y-2">
					<p className="text-body-sm text-fg-dim">API Calls</p>
					<p className="text-page-heading">45.2K</p>
					<Badge size="sm" icon="api">
						This Month
					</Badge>
				</div>
			</Card>
		</div>
	)
}

