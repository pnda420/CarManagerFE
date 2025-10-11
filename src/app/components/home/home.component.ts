import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IconComponent } from '../../shared/icon/icon.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [ CommonModule, FormsModule]
})
export class HomeComponent {

  constructor(public router: Router) { }

  // USP Daten
  usp = [
    {
      icon: 'speed',
      title: 'Schnelle Umsetzung',
      text: 'Von der Idee zum fertigen Produkt in Wochen, nicht Monaten. Agile Entwicklung mit regelmäßigen Updates.'
    },
    {
      icon: 'attach_money',
      title: 'Faire Preise',
      text: 'Transparente Kalkulation ohne versteckte Kosten. Als Einzelentwickler ohne Agentur-Overhead.'
    },
    {
      icon: 'code',
      title: 'Sauberer Code',
      text: 'Wartbare Architektur, klare Struktur und durchdachte APIs. Flexibel für zukünftige Anpassungen.'
    },
    {
      icon: 'forum',
      title: 'Direkte Kommunikation',
      text: 'Kein Projektmanager-Ping-Pong. Du sprichst direkt mit dem Entwickler, der dein Projekt umsetzt.'
    },
    {
      icon: 'verified_user',
      title: 'Zufriedenheitsgarantie',
      text: '14 Tage Geld-zurück-Garantie bei Unzufriedenheit. Dein Risiko ist minimal, deine Zufriedenheit Priorität.'
    },
    {
      icon: 'rocket_launch',
      title: 'Moderner Stack',
      text: 'Aktuelle, bewährte Technologien für zukunftssichere Lösungen. Keine veralteten Frameworks.'
    }
  ];

  // Tech Stack
  techStack = [
    'Angular',
    'TypeScript',
    'Node.js',
    'PostgreSQL',
    'REST APIs',
    'Git',
    'Docker',
    'Cloud Hosting'
  ];

  // Expertise Items
  expertiseItems = [
    {
      icon: '🎯',
      title: 'Klare Kommunikation',
      description: 'Kein Tech-Geschwurbel. Du verstehst immer, was gebaut wird und warum. Regelmäßige Updates und transparente Dokumentation.'
    },
    {
      icon: '⚡',
      title: 'Schnelle Umsetzung',
      description: 'Lean Development: Schnell zum MVP, dann iterieren basierend auf echtem Feedback. Keine monatelangen Planungsphasen.'
    },
    {
      icon: '🛠',
      title: 'Wartbarer Code',
      description: 'Saubere Architektur, durchdachte Struktur, klare APIs. Dein Projekt bleibt flexibel für zukünftige Anpassungen.'
    },
    {
      icon: '💰',
      title: 'Faire Preise',
      description: 'Transparente Kalkulation, keine versteckten Kosten. Als Einzelentwickler ohne Agentur-Overhead kann ich günstigere Konditionen bieten.'
    },
    {
      icon: '🔒',
      title: 'Zufriedenheitsgarantie',
      description: '14 Tage Geld-zurück-Garantie bei Unzufriedenheit. Dein Risiko ist minimal, deine Zufriedenheit meine Priorität.'
    },
    {
      icon: '🚀',
      title: 'Moderner Stack',
      description: 'Aktuelle, bewährte Technologien für zukunftssichere Lösungen. Keine veralteten Frameworks oder experimentellen Tools.'
    }
  ];

  // Target Groups
  targetGroups = [
    {
      icon: '💡',
      title: 'Startups & Gründer',
      description: 'MVP schnell und kosteneffizient umsetzen. Von der ersten Idee bis zum lauffähigen Prototyp - ohne unnötige Features, die noch niemand braucht.'
    },
    {
      icon: '🏢',
      title: 'Kleine Unternehmen',
      description: 'Bestehende Prozesse digitalisieren und automatisieren. Interne Tools, Verwaltungssysteme oder Kundenschnittstellen - maßgeschneidert für deine Abläufe.'
    },
    {
      icon: '🏪',
      title: 'Lokale Händler & Dienstleister',
      description: 'Professionelle Online-Präsenz aufbauen. Buchungssysteme, Produktkataloge oder Kundenverwaltung - einfach bedienbar, ohne IT-Abteilung.'
    }
  ];

  // Process Steps
  processSteps = [
    {
      title: 'Erstgespräch (kostenlos)',
      description: 'Wir klären deine Anforderungen, Ziele und technischen Möglichkeiten. Du bekommst eine erste Einschätzung zu Aufwand und Kosten.'
    },
    {
      title: 'Angebot & Planung',
      description: 'Detailliertes Angebot mit Festpreis oder Stundensatz. Gemeinsame Planung von Features, Meilensteinen und Timeline.'
    },
    {
      title: 'Entwicklung & Feedback',
      description: 'Iterative Umsetzung mit regelmäßigen Check-ins. Du siehst den Fortschritt und kannst frühzeitig Feedback geben.'
    },
    {
      title: 'Launch & Support',
      description: 'Deployment, Testing und Go-Live. Optional: Wartung, Updates und technischer Support nach dem Launch.'
    }
  ];

routeTo(path: string) {
    this.router.navigate([path]);
}

}